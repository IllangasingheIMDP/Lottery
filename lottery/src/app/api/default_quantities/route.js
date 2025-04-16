import db from '@/lib/db';
import { authenticate } from '@/lib/auth';
export async function GET(req) {
    
    const auth = authenticate(req,['samarakoonkumara@gmail.com']);
    if (auth.error) {
      return new Response(
        JSON.stringify({ error: auth.error }),
        { status: auth.status }
      );
    }
    try {
        const [rows] = await db.query(`
            SELECT lottery_type_id, SUM(quantity) as default_quantity
            FROM orders
            GROUP BY lottery_type_id
        `);
        const defaultQuantities = {};
        rows.forEach(row => {
            defaultQuantities[row.lottery_type_id] = row.default_quantity || 0;
        });
        return new Response(JSON.stringify(defaultQuantities), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
}