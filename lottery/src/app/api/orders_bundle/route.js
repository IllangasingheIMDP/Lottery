import db from '@/lib/db';
import { authenticate } from '@/lib/auth';

// Parse YYYY-MM-DD as a local date to avoid UTC skew
function parseLocalYMD(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function computeDayType(dateStr) {
  const d = parseLocalYMD(dateStr);
  const day = d.getDay();
  if (day === 0) return 'SUNDAY';
  if (day === 6) return 'SATURDAY';
  return 'WEEKDAY';
}

// GET /api/orders_bundle?dates=YYYY-MM-DD,YYYY-MM-DD
// Returns all data needed for Orders page in a single call.
export async function GET(req) {
  const auth = authenticate(req, ['samarakoonkumara@gmail.com']);
  if (auth.error) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const datesParam = searchParams.get('dates') || searchParams.get('date');
  const includeInactive = searchParams.get('includeInactive') === 'true';

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

    const [lotteryTypes] = await conn.query(
      'SELECT id, name, category FROM lottery_types ORDER BY name'
    );

    const [defaultRows] = await conn.query(`
      SELECT lottery_type_id, SUM(quantity) as default_quantity
      FROM orders
      GROUP BY lottery_type_id
    `);
    const defaultQuantities = {};
    defaultRows.forEach(row => {
      defaultQuantities[row.lottery_type_id] = row.default_quantity || 0;
    });

    const shopQuery = includeInactive
      ? 'SELECT * FROM shops'
      : 'SELECT * FROM shops WHERE active = TRUE';
    const [shops] = await conn.query(shopQuery);

    const [activeShops] = await conn.query('SELECT id FROM shops WHERE active = 1');
    const activeShopIds = activeShops.map(s => s.id);

    const [dateSpecificRows] = await conn.query(`
      SELECT shop_id, lottery_id, quantity, DATE_FORMAT(date, '%Y-%m-%d') AS date
      FROM distribution_rules
      WHERE date IN (?)
    `, [dates]);

    const neededDayTypes = Array.from(new Set(dates.map(d => computeDayType(d))));
    const [generalRows] = await conn.query(`
      SELECT shop_id, lottery_id, quantity, day_type
      FROM distribution_rules
      WHERE date IS NULL AND day_type IN (?)
    `, [neededDayTypes]);

    const dateSpecificMap = {};
    for (const r of dateSpecificRows) {
      if (!dateSpecificMap[r.date]) dateSpecificMap[r.date] = {};
      if (!dateSpecificMap[r.date][r.shop_id]) dateSpecificMap[r.date][r.shop_id] = {};
      dateSpecificMap[r.date][r.shop_id][r.lottery_id] = r.quantity;
    }

    const generalMap = {};
    for (const r of generalRows) {
      if (!generalMap[r.day_type]) generalMap[r.day_type] = {};
      if (!generalMap[r.day_type][r.shop_id]) generalMap[r.day_type][r.shop_id] = {};
      generalMap[r.day_type][r.shop_id][r.lottery_id] = r.quantity;
    }

    const distributionTotals = { dates: {} };

    for (const date of dates) {
      const dayType = computeDayType(date);
      const lotteryTotals = [];
      let grandTotal = 0;

      for (const lot of lotteryTypes) {
        let total = 0;
        for (const shopId of activeShopIds) {
          const dateSpecQty = dateSpecificMap[date]?.[shopId]?.[lot.id];
          if (dateSpecQty != null) {
            total += dateSpecQty;
          } else {
            const genQty = generalMap[dayType]?.[shopId]?.[lot.id];
            if (genQty != null) total += genQty;
          }
        }
        grandTotal += total;
        lotteryTotals.push({
          lottery_id: lot.id,
          name: lot.name,
          category: lot.category,
          quantity: total,
        });
      }

      distributionTotals.dates[date] = {
        day_type: dayType,
        lottery_totals: lotteryTotals,
        grand_total: grandTotal,
      };
    }

    const fromDate = dates[0];
    const toDate = dates[dates.length - 1];
    const [orderingNotes] = await conn.query(
      `
      SELECT 
        id,
        shop_id,
        DATE_FORMAT(note_date, '%Y-%m-%d') AS note_date,
        message,
        is_read,
        created_at,
        updated_at
      FROM ordering_notes
      WHERE note_date BETWEEN ? AND ?
      ORDER BY note_date DESC, id DESC
      LIMIT 200
    `,
      [fromDate, toDate]
    );

    return new Response(
      JSON.stringify({
        lotteryTypes,
        defaultQuantities,
        shops,
        distributionTotals,
        orderingNotes,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/orders_bundle error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
