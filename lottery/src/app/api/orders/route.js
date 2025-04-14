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
    const [orders] = await db.query('SELECT * FROM orders');
    return new Response(JSON.stringify(orders), { status: 200 });
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
    const orders = await req.json();
    let conn;
    try {
      conn = await db.getConnection();
      await conn.beginTransaction();
      for (const order of orders) {
        const { shop_id, lottery_type_id, quantity } = order;
        await conn.query(
          'INSERT INTO orders (shop_id, lottery_type_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = ?',
          [shop_id, lottery_type_id, quantity, quantity]
        );
      }
      await conn.commit();
      conn.release();
      return new Response(JSON.stringify({ message: 'Orders updated' }), { status: 200 });
    } catch (error) {
      if (conn) {
        await conn.rollback();
        conn.release();
      }
      return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
  }

// export async function POST(req) {
//     if (auth.error) {
//         return new Response(
//           JSON.stringify({ error: auth.error }),
//           { status: auth.status }
//         );
//       }
//     const { shop_id, lottery_type_id, quantity } = await req.json();
//     try {
//         await db.query(
//             'INSERT INTO orders (shop_id, lottery_type_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = ?',
//             [shop_id, lottery_type_id, quantity, quantity]
//         );
//         return new Response(JSON.stringify({ message: 'Order updated' }), { status: 200 });
//     } catch (error) {
//         return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
//     }
// }