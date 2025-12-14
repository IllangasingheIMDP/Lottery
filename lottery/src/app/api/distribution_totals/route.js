import db from '@/lib/db';
import { authenticate } from '@/lib/auth';

// Parse YYYY-MM-DD as a local date to avoid UTC skew
function parseLocalYMD(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function computeDayType(dateStr) {
  const d = parseLocalYMD(dateStr);
  const day = d.getDay(); // 0 Sunday ... 6 Saturday (local)
  if (day === 0) return 'SUNDAY';
  if (day === 6) return 'SATURDAY';
  return 'WEEKDAY';
}

// GET /api/distribution_totals?dates=YYYY-MM-DD,YYYY-MM-DD
// Returns aggregated distribution quantities across ALL active shops per lottery for each date.
// Logic: For each shop & lottery & date, use date-specific rule if exists; otherwise fall back to general rule for computed day_type; else 0.
export async function GET(req) {
  const auth = authenticate(req, ['samarakoonkumara@gmail.com']);
  if (auth.error) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const datesParam = searchParams.get('dates') || searchParams.get('date');
  if (!datesParam) {
    return new Response(JSON.stringify({ error: 'dates parameter required' }), { status: 400 });
  }
  const dates = datesParam.split(',').map(s => s.trim()).filter(Boolean);
  if (dates.length === 0) {
    return new Response(JSON.stringify({ error: 'No valid dates provided' }), { status: 400 });
  }

  let conn;
  try {
    conn = await db.getConnection();

    // Active shops
    const [shops] = await conn.query(`SELECT id FROM shops WHERE active = 1`);
    const shopIds = shops.map(s => s.id);

    // Lotteries
    const [lotteries] = await conn.query(`SELECT id, name, category FROM lottery_types ORDER BY name`);

    // Date-specific rules for these dates
    const [dateSpecificRows] = await conn.query(`
      SELECT shop_id, lottery_id, quantity, DATE_FORMAT(date, '%Y-%m-%d') AS date
      FROM distribution_rules
      WHERE date IN (?)
    `, [dates]);

    // General rules for needed day types
    const neededDayTypes = Array.from(new Set(dates.map(d => computeDayType(d))));
    const [generalRows] = await conn.query(`
      SELECT shop_id, lottery_id, quantity, day_type
      FROM distribution_rules
      WHERE date IS NULL AND day_type IN (?)
    `, [neededDayTypes]);

    // Build maps
    const dateSpecificMap = {}; // date -> shop_id -> lottery_id -> quantity
    for (const r of dateSpecificRows) {
      if (!dateSpecificMap[r.date]) dateSpecificMap[r.date] = {};
      if (!dateSpecificMap[r.date][r.shop_id]) dateSpecificMap[r.date][r.shop_id] = {};
      dateSpecificMap[r.date][r.shop_id][r.lottery_id] = r.quantity;
    }

    const generalMap = {}; // day_type -> shop_id -> lottery_id -> quantity
    for (const r of generalRows) {
      if (!generalMap[r.day_type]) generalMap[r.day_type] = {};
      if (!generalMap[r.day_type][r.shop_id]) generalMap[r.day_type][r.shop_id] = {};
      generalMap[r.day_type][r.shop_id][r.lottery_id] = r.quantity;
    }

    const result = { dates: {} };

    for (const date of dates) {
      const dayType = computeDayType(date);
      const lotteryTotals = [];
      let grandTotal = 0;
      for (const lot of lotteries) {
        let total = 0;
        for (const shopId of shopIds) {
          const dateSpecQty = dateSpecificMap[date]?.[shopId]?.[lot.id];
          if (dateSpecQty != null) {
            total += dateSpecQty;
          } else {
            const genQty = generalMap[dayType]?.[shopId]?.[lot.id];
            if (genQty != null) total += genQty;
          }
        }
        grandTotal += total;
        lotteryTotals.push({ lottery_id: lot.id, name: lot.name, category: lot.category, quantity: total });
      }
      result.dates[date] = { day_type: dayType, lottery_totals: lotteryTotals, grand_total: grandTotal };
    }

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (err) {
    console.error('Error computing distribution totals:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
