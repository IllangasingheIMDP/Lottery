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
        const cacheKey = 'cache:default_quantities';
        const cachedData = await redis.get(cacheKey);

        if (cachedData) {
            return new Response(cachedData, {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const [rows] = await db.query(`
            SELECT lottery_type_id, SUM(quantity) as default_quantity
            FROM orders
            GROUP BY lottery_type_id
        `);
        const defaultQuantities = {};
        rows.forEach(row => {
            defaultQuantities[row.lottery_type_id] = row.default_quantity || 0;
        });

        const responseJson = JSON.stringify(defaultQuantities);
        // Cache for 1 hour
        await redis.set(cacheKey, responseJson, { EX: 3600 });

        return new Response(responseJson, { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
}