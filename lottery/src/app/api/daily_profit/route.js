import db from '@/lib/db';
import { authenticate } from '@/lib/auth';

// GET - Public: list daily profits, with optional filters
// Query params supported:
// - id: number (fetch single by id)
// - date: YYYY-MM-DD (exact date)
// - from, to: YYYY-MM-DD (date range)
export async function GET(req) {
	try {
		const { searchParams } = new URL(req.url);
		const id = searchParams.get('id');
		const date = searchParams.get('date');
		const from = searchParams.get('from');
		const to = searchParams.get('to');

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
				kumara_profit,
				manager_profit,
				(kumara_profit + manager_profit) AS total_profit
			FROM daily_profit
			${where.length ? 'WHERE ' + where.join(' AND ') : ''}
			ORDER BY date DESC, id DESC
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
		const { date, kumara_profit, manager_profit } = await req.json();

		if (!date || kumara_profit === undefined || kumara_profit === null || manager_profit === undefined || manager_profit === null) {
			return new Response(
				JSON.stringify({ error: 'date, kumara_profit, and manager_profit are required' }),
				{ status: 400 }
			);
		}

		// Validate profits are numbers
		if (typeof kumara_profit !== 'number' || !Number.isInteger(kumara_profit)) {
			return new Response(
				JSON.stringify({ error: 'kumara_profit must be an integer' }),
				{ status: 400 }
			);
		}

		if (typeof manager_profit !== 'number' || !Number.isInteger(manager_profit)) {
			return new Response(
				JSON.stringify({ error: 'manager_profit must be an integer' }),
				{ status: 400 }
			);
		}

		// First, check if a record exists for this date
		const checkSql = 'SELECT id FROM daily_profit WHERE date = ?';
		const [existingRecords] = await db.query(checkSql, [date]);

		if (existingRecords.length > 0) {
			// Record exists, update it instead
			const updateSql = 'UPDATE daily_profit SET kumara_profit = ?, manager_profit = ? WHERE date = ?';
			await db.query(updateSql, [kumara_profit, manager_profit, date]);
			return new Response(
				JSON.stringify({ 
					message: 'Daily profit record updated successfully (existing date found)',
					action: 'updated',
					total_profit: kumara_profit + manager_profit
				}), 
				{ status: 200 }
			);
		} else {
			// No existing record, create new one
			const insertSql = 'INSERT INTO daily_profit (date, kumara_profit, manager_profit) VALUES (?, ?, ?)';
			await db.query(insertSql, [date, kumara_profit, manager_profit]);
			return new Response(
				JSON.stringify({ 
					message: 'Daily profit record created successfully',
					action: 'created',
					total_profit: kumara_profit + manager_profit
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
		const { id, date, kumara_profit, manager_profit } = await req.json();
		
		if (kumara_profit === undefined || kumara_profit === null || manager_profit === undefined || manager_profit === null) {
			return new Response(JSON.stringify({ error: 'kumara_profit and manager_profit are required' }), { status: 400 });
		}

		// Validate profits are numbers
		if (typeof kumara_profit !== 'number' || !Number.isInteger(kumara_profit)) {
			return new Response(
				JSON.stringify({ error: 'kumara_profit must be an integer' }),
				{ status: 400 }
			);
		}

		if (typeof manager_profit !== 'number' || !Number.isInteger(manager_profit)) {
			return new Response(
				JSON.stringify({ error: 'manager_profit must be an integer' }),
				{ status: 400 }
			);
		}

		let sql, params;
		if (id) {
			sql = 'UPDATE daily_profit SET date = COALESCE(?, date), kumara_profit = ?, manager_profit = ? WHERE id = ?';
			params = [date ?? null, kumara_profit, manager_profit, id];
		} else if (date) {
			sql = 'UPDATE daily_profit SET kumara_profit = ?, manager_profit = ? WHERE date = ?';
			params = [kumara_profit, manager_profit, date];
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
		return new Response(JSON.stringify({ 
			message: 'Daily profit record updated successfully',
			total_profit: kumara_profit + manager_profit
		}), { status: 200 });
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