// src/app/api/auth/login/route.js
import { authenticate } from '@/lib/auth';
import db from '@/lib/db'; // this is your mysql2/promise pool

export async function GET(req) {
  // 1) auth guard
  const auth = authenticate(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error }),
      { status: auth.status }
    );
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  try {
    console.log(date);
    // db.query() returns [rows, fields]
    const [records] = await db.query('SELECT * FROM daily_records WHERE date = ?', [date]);
    return new Response(JSON.stringify(records), { status: 200 });
  } catch (error) {
    console.error('GET /api/daily_records error:', error);
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500 }
    );
  }
}
