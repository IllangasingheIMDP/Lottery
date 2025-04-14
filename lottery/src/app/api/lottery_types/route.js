import db from '@/lib/db';
import { authenticate } from '@/lib/auth';

export async function GET(req) {
  const auth = authenticate(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error }),
      { status: auth.status }
    );
  }

  try {
    // db.query() returns [rows, fields]
    const [lotteryTypes] = await db.query('SELECT * FROM lottery_types');
    return new Response(JSON.stringify(lotteryTypes), { status: 200 });
  } catch (error) {
    console.error('GET /api/shops error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}