import db from '@/lib/db';
import { authenticate } from '@/lib/auth';

// GET - Public: list notes, with optional filters
// Query params supported:
// - id: number (fetch single by id)
// - shop_id: number
// - date: YYYY-MM-DD (exact note_date)
// - from, to: YYYY-MM-DD (date range)
// - limit: number (defaults 200)
export async function GET(req) {
	try {
		const { searchParams } = new URL(req.url);
		const id = searchParams.get('id');
		const shopId = searchParams.get('shop_id');
		const date = searchParams.get('date');
		const from = searchParams.get('from');
		const to = searchParams.get('to');
		const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 1000);

		const where = [];
		const params = [];

		if (id) {
			where.push('id = ?');
			params.push(id);
		}
		if (shopId) {
			where.push('shop_id = ?');
			params.push(shopId);
		}
		if (date) {
			where.push('note_date = ?');
			params.push(date);
		}
		if (from && to) {
			where.push('note_date BETWEEN ? AND ?');
			params.push(from, to);
		} else if (from) {
			where.push('note_date >= ?');
			params.push(from);
		} else if (to) {
			where.push('note_date <= ?');
			params.push(to);
		}

		const sql = `
			SELECT 
				id,
				shop_id,
				DATE_FORMAT(note_date, '%Y-%m-%d') AS note_date,
				message,
				is_read,
				created_at,
				updated_at
			FROM ordering_notes
			${where.length ? 'WHERE ' + where.join(' AND ') : ''}
			ORDER BY note_date DESC, id DESC
			LIMIT ${Number.isFinite(limit) ? limit : 200}
		`;

		const [rows] = await db.query(sql, params);
		return new Response(JSON.stringify(rows), { status: 200 });
	} catch (error) {
		console.error('GET /api/ordering_notes error:', error);
		return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
	}
}

// POST - Create a new note (editor only)
export async function POST(req) {
	// Assumption: editor gmail is 'samarakoonkumara@gmail.com'. Adjust if different.
	const auth = authenticate(req, ['samarakoonkumara@gmail.com']);
	if (auth.error) {
		return new Response(JSON.stringify({ error: auth.error }), { status: auth.status });
	}

	try {
		const { shop_id, note_date, message } = await req.json();

		if (!shop_id || !note_date || !message) {
			return new Response(
				JSON.stringify({ error: 'shop_id, note_date, and message are required' }),
				{ status: 400 }
			);
		}

		const sql = `
			INSERT INTO ordering_notes (shop_id, note_date, message)
			VALUES (?, ?, ?)
		`;
		await db.query(sql, [shop_id, note_date, message]);
		return new Response(JSON.stringify({ message: 'Note created successfully' }), { status: 201 });
	} catch (error) {
		// Handle duplicate (unique shop_id+note_date)
		if (error && error.code === 'ER_DUP_ENTRY') {
			return new Response(
				JSON.stringify({ error: 'A note for this shop and date already exists' }),
				{ status: 409 }
			);
		}
		console.error('POST /api/ordering_notes error:', error);
		return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
	}
}

// PUT - Update an existing note (by id or by composite key) (editor only)
export async function PUT(req) {
	const auth = authenticate(req, ['samarakoonkumara@gmail.com']);
	if (auth.error) {
		return new Response(JSON.stringify({ error: auth.error }), { status: auth.status });
	}

	try {
		const { id, shop_id, note_date, message } = await req.json();
		if (!message) {
			return new Response(JSON.stringify({ error: 'message is required' }), { status: 400 });
		}

		let sql, params;
		if (id) {
			sql = 'UPDATE ordering_notes SET shop_id = COALESCE(?, shop_id), note_date = COALESCE(?, note_date), message = ? WHERE id = ?';
			params = [shop_id ?? null, note_date ?? null, message, id];
		} else if (shop_id && note_date) {
			sql = 'UPDATE ordering_notes SET message = ? WHERE shop_id = ? AND note_date = ?';
			params = [message, shop_id, note_date];
		} else {
			return new Response(
				JSON.stringify({ error: 'Provide either id, or shop_id and note_date' }),
				{ status: 400 }
			);
		}

		const [result] = await db.query(sql, params);
		if (result.affectedRows === 0) {
			return new Response(JSON.stringify({ error: 'Note not found' }), { status: 404 });
		}
		return new Response(JSON.stringify({ message: 'Note updated successfully' }), { status: 200 });
	} catch (error) {
		// Handle unique key conflict when changing shop_id/note_date
		if (error && error.code === 'ER_DUP_ENTRY') {
			return new Response(
				JSON.stringify({ error: 'Another note already exists for this shop and date' }),
				{ status: 409 }
			);
		}
		console.error('PUT /api/ordering_notes error:', error);
		return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
	}
}

// DELETE - Remove a note (by id or by composite key) (editor only)
export async function DELETE(req) {
	const auth = authenticate(req, ['samarakoonkumara@gmail.com']);
	if (auth.error) {
		return new Response(JSON.stringify({ error: auth.error }), { status: auth.status });
	}

	try {
		const { searchParams } = new URL(req.url);
		const id = searchParams.get('id');
		const shopId = searchParams.get('shop_id');
		const date = searchParams.get('date');

		let sql, params;
		if (id) {
			sql = 'DELETE FROM ordering_notes WHERE id = ?';
			params = [id];
		} else if (shopId && date) {
			sql = 'DELETE FROM ordering_notes WHERE shop_id = ? AND note_date = ?';
			params = [shopId, date];
		} else {
			return new Response(
				JSON.stringify({ error: 'Provide either id, or shop_id and date' }),
				{ status: 400 }
			);
		}

		const [result] = await db.query(sql, params);
		if (result.affectedRows === 0) {
			return new Response(JSON.stringify({ error: 'Note not found' }), { status: 404 });
		}
		return new Response(JSON.stringify({ message: 'Note deleted successfully' }), { status: 200 });
	} catch (error) {
		console.error('DELETE /api/ordering_notes error:', error);
		return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
	}
}

// PATCH - Mark note as read/unread (authenticated users)
export async function PATCH(req) {
	const auth = authenticate(req, ['samarakoonkumara@gmail.com', 'a@gmail.com']);
	if (auth.error) {
		return new Response(JSON.stringify({ error: auth.error }), { status: auth.status });
	}

	try {
		const { id, is_read } = await req.json();

		if (!id || typeof is_read !== 'boolean') {
			return new Response(
				JSON.stringify({ error: 'id and is_read (boolean) are required' }),
				{ status: 400 }
			);
		}

		const sql = 'UPDATE ordering_notes SET is_read = ? WHERE id = ?';
		const [result] = await db.query(sql, [is_read ? 1 : 0, id]);

		if (result.affectedRows === 0) {
			return new Response(JSON.stringify({ error: 'Note not found' }), { status: 404 });
		}

		return new Response(
			JSON.stringify({ message: `Note marked as ${is_read ? 'read' : 'unread'} successfully` }),
			{ status: 200 }
		);
	} catch (error) {
		console.error('PATCH /api/ordering_notes error:', error);
		return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
	}
}

