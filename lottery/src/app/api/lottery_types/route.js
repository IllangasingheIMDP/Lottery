import db from '@/lib/db';
import { authenticate } from '@/lib/auth';
import redis from '@/lib/redis';

export async function GET(req) {
  const auth = authenticate(req,['samarakoonkumara@gmail.com']);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error }),
      { status: auth.status }
    );
  }

  try {
    const cacheKey = 'cache:lottery_types';
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      return new Response(cachedData, { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // db.query() returns [rows, fields]
    const [lotteryTypes] = await db.query('SELECT * FROM lottery_types');
    const responseJson = JSON.stringify(lotteryTypes);

    // Cache for 24 hours (86400 seconds)
    await redis.set(cacheKey, responseJson, { EX: 86400 });

    return new Response(responseJson, { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('GET /api/lottery_types error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}