import db from '@/lib/db';
import { authenticate } from '@/lib/auth';

// GET - Public: list daily profits, with optional filters
// Query params supported:
// - id: number (fetch single by id)
// - date: YYYY-MM-DD (exact date)
// - from, to: YYYY-MM-DD (date range)
// - limit: number (defaults 200)
export async function GET(req) {
	try {
		const { searchParams } = new URL(req.url);
		const id = searchParams.get('id');
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
		if (date) {
			where.push('date = ?');
			params.push(date);
		}
		if (from && to) {
			where.push('date BETWEEN ? AND ?');
			params.push(from, to);
		} else if (from) {
			where.push('date >= ?');
			params.push(from);
		} else if (to) {
			where.push('date <= ?');
			params.push(to);
		}

		const sql = `
			SELECT 
				id,
				DATE_FORMAT(date, '%Y-%m-%d') AS date,
				profit
			FROM daily_profit
			${where.length ? 'WHERE ' + where.join(' AND ') : ''}
			ORDER BY date DESC, id DESC
			LIMIT ${Number.isFinite(limit) ? limit : 200}
		`;

		const [rows] = await db.query(sql, params);
		return new Response(JSON.stringify(rows), { status: 200 });
	} catch (error) {
		console.error('GET /api/daily_profit error:', error);
		return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
	}
}

// POST - Create a new daily profit record (editor only)
export async function POST(req) {
	// Assumption: editor gmail is 'samarakoonkumara@gmail.com'. Adjust if different.
	const auth = authenticate(req, ['samarakoonkumara@gmail.com']);
	if (auth.error) {
		return new Response(JSON.stringify({ error: auth.error }), { status: auth.status });
	}

	try {
		const { date, profit } = await req.json();

		if (!date || profit === undefined || profit === null) {
			return new Response(
				JSON.stringify({ error: 'date and profit are required' }),
				{ status: 400 }
			);
		}

		// Validate profit is a number
		if (typeof profit !== 'number' || !Number.isInteger(profit)) {
			return new Response(
				JSON.stringify({ error: 'profit must be an integer' }),
				{ status: 400 }
			);
		}

		// First, check if a record exists for this date
		const checkSql = 'SELECT id FROM daily_profit WHERE date = ?';
		const [existingRecords] = await db.query(checkSql, [date]);

		if (existingRecords.length > 0) {
			// Record exists, update it instead
			const updateSql = 'UPDATE daily_profit SET profit = ? WHERE date = ?';
			await db.query(updateSql, [profit, date]);
			return new Response(
				JSON.stringify({ 
					message: 'Daily profit record updated successfully (existing date found)',
					action: 'updated'
				}), 
				{ status: 200 }
			);
		} else {
			// No existing record, create new one
			const insertSql = 'INSERT INTO daily_profit (date, profit) VALUES (?, ?)';
			await db.query(insertSql, [date, profit]);
			return new Response(
				JSON.stringify({ 
					message: 'Daily profit record created successfully',
					action: 'created'
				}), 
				{ status: 201 }
			);
		}
	} catch (error) {
		console.error('POST /api/daily_profit error:', error);
		return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
	}
}

// PUT - Update an existing daily profit record (by id or by date) (editor only)
export async function PUT(req) {
	const auth = authenticate(req, ['samarakoonkumara@gmail.com']);
	if (auth.error) {
		return new Response(JSON.stringify({ error: auth.error }), { status: auth.status });
	}

	try {
		const { id, date, profit } = await req.json();
		
		if (profit === undefined || profit === null) {
			return new Response(JSON.stringify({ error: 'profit is required' }), { status: 400 });
		}

		// Validate profit is a number
		if (typeof profit !== 'number' || !Number.isInteger(profit)) {
			return new Response(
				JSON.stringify({ error: 'profit must be an integer' }),
				{ status: 400 }
			);
		}

		let sql, params;
		if (id) {
			sql = 'UPDATE daily_profit SET date = COALESCE(?, date), profit = ? WHERE id = ?';
			params = [date ?? null, profit, id];
		} else if (date) {
			sql = 'UPDATE daily_profit SET profit = ? WHERE date = ?';
			params = [profit, date];
		} else {
			return new Response(
				JSON.stringify({ error: 'Provide either id or date' }),
				{ status: 400 }
			);
		}

		const [result] = await db.query(sql, params);
		if (result.affectedRows === 0) {
			return new Response(JSON.stringify({ error: 'Daily profit record not found' }), { status: 404 });
		}
		return new Response(JSON.stringify({ message: 'Daily profit record updated successfully' }), { status: 200 });
	} catch (error) {
		// Handle unique key conflict when changing date
		if (error && error.code === 'ER_DUP_ENTRY') {
			return new Response(
				JSON.stringify({ error: 'Another profit record already exists for this date' }),
				{ status: 409 }
			);
		}
		console.error('PUT /api/daily_profit error:', error);
		return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
	}
}

// DELETE - Remove a daily profit record (by id or by date) (editor only)
export async function DELETE(req) {
	const auth = authenticate(req, ['samarakoonkumara@gmail.com']);
	if (auth.error) {
		return new Response(JSON.stringify({ error: auth.error }), { status: auth.status });
	}

	try {
		const { searchParams } = new URL(req.url);
		const id = searchParams.get('id');
		const date = searchParams.get('date');

		let sql, params;
		if (id) {
			sql = 'DELETE FROM daily_profit WHERE id = ?';
			params = [id];
		} else if (date) {
			sql = 'DELETE FROM daily_profit WHERE date = ?';
			params = [date];
		} else {
			return new Response(
				JSON.stringify({ error: 'Provide either id or date' }),
				{ status: 400 }
			);
		}

		const [result] = await db.query(sql, params);
		if (result.affectedRows === 0) {
			return new Response(JSON.stringify({ error: 'Daily profit record not found' }), { status: 404 });
		}
		return new Response(JSON.stringify({ message: 'Daily profit record deleted successfully' }), { status: 200 });
	} catch (error) {
		console.error('DELETE /api/daily_profit error:', error);
		return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
	}
}