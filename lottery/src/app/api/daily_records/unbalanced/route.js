// src/app/api/daily_records/unbalanced/route.js
import { authenticate } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(req) {
  const auth = authenticate(req, ['samarakoonkumara@gmail.com', 'a@gmail.com']);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error }),
      { status: auth.status }
    );
  }

  try {
    const [records] = await db.query(`
      SELECT 
        DATE_FORMAT(dr.date, '%Y-%m-%d') AS date,
        s.id AS shop_id,
        s.name AS shop_name,
        dr.balanced,dr.faulty_total_price,(dr.total_worth - (dr.faulty_total_price + dr.cash_given + dr.got_tickets_total_price)) AS remaining_balance,
        CASE 
          WHEN dr.faulty IS NOT NULL AND JSON_LENGTH(dr.faulty) > 0 THEN 1 
          ELSE 0 
        END AS has_faulty
      FROM daily_records dr
      JOIN shops s ON dr.shop_id = s.id
      WHERE dr.balanced = 0 OR (dr.faulty IS NOT NULL AND JSON_LENGTH(dr.faulty) > 0)
      ORDER BY dr.date DESC, s.name
    `);
       // console.log(records);
    // Group records by date
    const groupedRecords = records.reduce((acc, record) => {
      const date = record.date;
      if (!acc[date]) {
        acc[date] = { date, shops: [] };
      }
      acc[date].shops.push({
        shop_id: record.shop_id,
        shop_name: record.shop_name,
        balanced: record.balanced,
        has_faulty: record.has_faulty,
        remaining_balance: record.remaining_balance,
        faulty_total_price: record.faulty_total_price
      });
      return acc;
    }, {});

    // Convert to array format
    const result = Object.values(groupedRecords);

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('GET /api/daily_records/unbalanced error:', error);
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500 }
    );
  }
}