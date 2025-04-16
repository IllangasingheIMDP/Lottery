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
    const { searchParams } = new URL(req.url);
    const dates = searchParams.get('dates').split(',');
    console.log(dates);
    try {
        const [rows] = await db.query(`
           SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, lottery_type_id, quantity
            FROM daily_orders
            WHERE date IN (?)
        `, [dates]);
        const dailyOrders = {};
        rows.forEach(row => {
            const dateStr = row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date;
            if (!dailyOrders[dateStr]) dailyOrders[dateStr] = {};
            dailyOrders[dateStr][row.lottery_type_id] = row.quantity;
        });

        console.log(dailyOrders);
        return new Response(JSON.stringify(dailyOrders), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
}

export async function POST(req) {
    const auth = authenticate(req);
    if (auth.error) {
        return new Response(
            JSON.stringify({ error: auth.error }),
            { status: auth.status }
        );
    }
    const dailyOrders = await req.json();
    let conn;
    try {
        conn = await db.getConnection();
        await conn.beginTransaction();

        // Prepare values as a 2D array for batch insert/update
        const values = dailyOrders.map(order => [
            order.date,
            order.lottery_type_id,
            order.quantity
        ]);

        // Single batch query
        const query = `
            INSERT INTO daily_orders (date, lottery_type_id, quantity)
            VALUES ?
            ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
        `;

        // Execute the batch query
        await conn.query(query, [values]);

        await conn.commit();
        return new Response(JSON.stringify({ message: 'Daily orders updated' }), { status: 200 });
    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Error saving orders:', error); // Log for debugging
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    } finally {
        if (conn) conn.release();
    }
}