import db from '@/lib/db';
import { authenticate } from '@/lib/auth';

export const maxDuration = 60;

// Helper to determine day type from a date string (YYYY-MM-DD)
function computeDayType(dateStr, override) {
	if (override && ['WEEKDAY','SATURDAY','SUNDAY','HOLIDAY'].includes(override)) {
		return override;
	}
	const d = new Date(dateStr + 'T00:00:00'); // ensure no timezone shift
	const day = d.getUTCDay(); // 0 Sunday ... 6 Saturday
	// Correct mapping: 0=Sunday, 6=Saturday
	if (day === 6) return 'SUNDAY';
	if (day === 5) return 'SATURDAY';
	return 'WEEKDAY';
}

// GET /api/daily_distributions?shop_id=..&date=YYYY-MM-DD
// Returns effective rules for the given shop & date (date-specific if exists, else general by computed day_type)
export async function GET(req) {
	const auth = authenticate(req, ['samarakoonkumara@gmail.com']);
	if (auth.error) {
		return new Response(JSON.stringify({ error: auth.error }), { status: auth.status });
	}

	const { searchParams } = new URL(req.url);
	const shopId = searchParams.get('shop_id');
	const date = searchParams.get('date');
	const explicitDayType = searchParams.get('day_type');
	if (!shopId) {
		return new Response(JSON.stringify({ error: 'shop_id is required' }), { status: 400 });
	}

	let conn;
	try {
		conn = await db.getConnection();

		// Fetch all lotteries for consistent listing
		const [lotteries] = await conn.query(`
			SELECT id, name, category
			FROM lottery_types
			ORDER BY name
		`);

		// If editing general rules explicitly: no date provided, but day_type is supplied
		if (!date && explicitDayType) {
			if (!['WEEKDAY','SATURDAY','SUNDAY','HOLIDAY'].includes(explicitDayType)) {
				return new Response(JSON.stringify({ error: 'Invalid day_type' }), { status: 400 });
			}
			// Pick the latest row per lottery to avoid stale duplicates
			const [generalRules] = await conn.query(`
				SELECT dr.rule_id, dr.lottery_id, dr.quantity, dr.day_type, lt.name, lt.category
				FROM distribution_rules dr
				JOIN (
					SELECT lottery_id, MAX(rule_id) AS max_id
					FROM distribution_rules
					WHERE shop_id = ? AND date IS NULL AND day_type = ?
					GROUP BY lottery_id
				) m ON dr.lottery_id = m.lottery_id AND dr.rule_id = m.max_id
				JOIN lottery_types lt ON dr.lottery_id = lt.id
				ORDER BY lt.name
			`, [shopId, explicitDayType]);
			const byIdGeneral = new Map(generalRules.map(r => [r.lottery_id, r]));
			const rules = lotteries.map(l => {
				if (byIdGeneral.has(l.id)) {
					const r = byIdGeneral.get(l.id);
					return { lottery_id: l.id, name: l.name, category: l.category, quantity: r.quantity, day_type: r.day_type, dateSpecific: false };
				}
				return { lottery_id: l.id, name: l.name, category: l.category, quantity: 0, day_type: explicitDayType, dateSpecific: false };
			});
			return new Response(JSON.stringify({ mode: 'general-edit', shop_id: Number(shopId), date: null, day_type: explicitDayType, rules }), { status: 200 });
		}

		if (!date) {
			return new Response(JSON.stringify({ error: 'date is required unless day_type provided for general edit' }), { status: 400 });
		}

		// First try date-specific rules
		const [dateSpecific] = await conn.query(`
			SELECT dr.rule_id, dr.lottery_id, dr.quantity, dr.day_type, lt.name, lt.category
			FROM distribution_rules dr
			JOIN lottery_types lt ON dr.lottery_id = lt.id
			WHERE dr.shop_id = ? AND dr.date = ?
			ORDER BY lt.name
		`, [shopId, date]);

		if (dateSpecific.length > 0) {
			const byId = new Map(dateSpecific.map(r => [r.lottery_id, r]));
			const rules = lotteries.map(l => {
				if (byId.has(l.id)) {
					const r = byId.get(l.id);
					return { lottery_id: l.id, name: l.name, category: l.category, quantity: r.quantity, day_type: r.day_type, dateSpecific: true };
				}
				return { lottery_id: l.id, name: l.name, category: l.category, quantity: 0, day_type: dateSpecific[0].day_type, dateSpecific: true };
			});
			return new Response(JSON.stringify({ mode: 'date-specific', shop_id: Number(shopId), date, day_type: dateSpecific[0].day_type, rules }), { status: 200 });
		}

		const computedDayType = computeDayType(date);
		// Pick the latest row per lottery to avoid stale duplicates
		const [generalRules] = await conn.query(`
			SELECT dr.rule_id, dr.lottery_id, dr.quantity, dr.day_type, lt.name, lt.category
			FROM distribution_rules dr
			JOIN (
				SELECT lottery_id, MAX(rule_id) AS max_id
				FROM distribution_rules
				WHERE shop_id = ? AND date IS NULL AND day_type = ?
				GROUP BY lottery_id
			) m ON dr.lottery_id = m.lottery_id AND dr.rule_id = m.max_id
			JOIN lottery_types lt ON dr.lottery_id = lt.id
			ORDER BY lt.name
		`, [shopId, computedDayType]);

		const byIdGeneral = new Map(generalRules.map(r => [r.lottery_id, r]));
		const rules = lotteries.map(l => {
			if (byIdGeneral.has(l.id)) {
				const r = byIdGeneral.get(l.id);
				return { lottery_id: l.id, name: l.name, category: l.category, quantity: r.quantity, day_type: r.day_type, dateSpecific: false };
			}
			return { lottery_id: l.id, name: l.name, category: l.category, quantity: 0, day_type: computedDayType, dateSpecific: false };
		});

		return new Response(JSON.stringify({ mode: 'general', shop_id: Number(shopId), date, day_type: computedDayType, rules }), { status: 200 });
	} catch (err) {
		console.error('Error fetching distribution rules:', err);
		return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
	} finally {
		if (conn) conn.release();
	}
}

// POST - Upsert multiple rules for a specific date (or general if date=null) for a shop.
// Payload: { shop_id, date, day_type?, rules: [{ lottery_id, quantity }] }
export async function POST(req) {
	const auth = authenticate(req, ['samarakoonkumara@gmail.com']);
	if (auth.error) {
		return new Response(JSON.stringify({ error: auth.error }), { status: auth.status });
	}

	let payload;
	try {
		payload = await req.json();
	} catch {
		return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
	}
	const { shop_id: shopId, date, day_type: suppliedDayType, rules } = payload;
	if (!shopId || !rules || !Array.isArray(rules) || rules.length === 0) {
		return new Response(JSON.stringify({ error: 'shop_id and non-empty rules array required' }), { status: 400 });
	}
	// For date-specific rules date must be provided; if date omitted treat as general rule requiring day_type.
	let dayType;
	if (date) {
		dayType = computeDayType(date, suppliedDayType); // allow holiday override
	} else {
		if (!suppliedDayType) {
			return new Response(JSON.stringify({ error: 'day_type required when date is null' }), { status: 400 });
		}
		dayType = suppliedDayType;
	}

	let conn;
	try {
		conn = await db.getConnection();
		await conn.beginTransaction();

		// For general rules (date is null), clear existing rows first to avoid duplicates
		if (!date) {
			await conn.query(
				`DELETE FROM distribution_rules WHERE shop_id = ? AND date IS NULL AND day_type = ?`,
				[shopId, dayType]
			);
		}

		const values = [];
		for (const r of rules) {
			if (!r.lottery_id || r.quantity == null || isNaN(r.quantity)) {
				await conn.rollback();
				return new Response(JSON.stringify({ error: 'Each rule must have lottery_id and numeric quantity' }), { status: 400 });
			}
			values.push([shopId, r.lottery_id, date || null, dayType, Number(r.quantity)]);
		}

		const BATCH_SIZE = 500;
		for (let i = 0; i < values.length; i += BATCH_SIZE) {
			const batch = values.slice(i, i + BATCH_SIZE);
			await conn.query(
				`
				INSERT INTO distribution_rules (shop_id, lottery_id, date, day_type, quantity)
				VALUES ?
				ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
				`,
				[batch]
			);
		}

		// If this is a date-specific save, update daily_orders to reflect totals across all shops
		if (date) {
			// Compute totals per lottery type for the given date
			const [totals] = await conn.query(`
				SELECT dr.lottery_id AS lottery_type_id, SUM(dr.quantity) AS total_quantity
				FROM distribution_rules dr
				WHERE dr.date = ?
				GROUP BY dr.lottery_id
			`, [date]);

			if (totals && totals.length > 0) {
				const values = totals.map(t => [date, t.lottery_type_id, Number(t.total_quantity)]);
				await conn.query(`
					INSERT INTO daily_orders (date, lottery_type_id, quantity)
					VALUES ?
					ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
				`, [values]);
			}
		}

		await conn.commit();
		return new Response(JSON.stringify({ message: 'Rules saved', shop_id: shopId, date: date || null, day_type: dayType, daily_orders_updated: Boolean(date) }), { status: 200 });
	} catch (err) {
		if (conn) await conn.rollback();
		console.error('Error saving distribution rules:', err);
		return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
	} finally {
		if (conn) conn.release();
	}
}

// DELETE - Remove date-specific rules (shop_id & date) OR general rules (shop_id & day_type & date=null)
// Query params: shop_id & date OR shop_id & day_type (for general rules)
export async function DELETE(req) {
	const auth = authenticate(req, ['samarakoonkumara@gmail.com']);
	if (auth.error) {
		return new Response(JSON.stringify({ error: auth.error }), { status: auth.status });
	}

	const { searchParams } = new URL(req.url);
	const shopId = searchParams.get('shop_id');
	const date = searchParams.get('date');
	const dayType = searchParams.get('day_type');
	if (!shopId) {
		return new Response(JSON.stringify({ error: 'shop_id required' }), { status: 400 });
	}
	if (!date && !dayType) {
		return new Response(JSON.stringify({ error: 'Provide either date or day_type' }), { status: 400 });
	}

	let conn;
	try {
		conn = await db.getConnection();
		await conn.beginTransaction();

		let affected = 0;
		if (date) {
			const [res] = await conn.query(`DELETE FROM distribution_rules WHERE shop_id = ? AND date = ?`, [shopId, date]);
			affected += res.affectedRows;
		} else {
			const [res] = await conn.query(`DELETE FROM distribution_rules WHERE shop_id = ? AND date IS NULL AND day_type = ?`, [shopId, dayType]);
			affected += res.affectedRows;
		}
		await conn.commit();
		return new Response(JSON.stringify({ message: 'Rules deleted', affected }), { status: 200 });
	} catch (err) {
		if (conn) await conn.rollback();
		console.error('Error deleting distribution rules:', err);
		return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
	} finally {
		if (conn) conn.release();
	}
}

