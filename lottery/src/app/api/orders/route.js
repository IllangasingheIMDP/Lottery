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
    const [orders] = await db.query('SELECT * FROM orders');
    return new Response(JSON.stringify(orders), { status: 200 });
} catch (error) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
}
}
export async function POST(req) {
  const auth = authenticate(req, ['samarakoonkumara@gmail.com']);
  if (auth.error) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status });
  }

  let conn;
  try {
    const orders = await req.json();
    if (!orders || orders.length === 0) {
      return new Response(JSON.stringify({ error: 'No orders provided' }), { status: 400 });
    }

    conn = await db.getConnection();
    await conn.beginTransaction();

    // Prepare bulk insert values
    const values = orders.map(({ shop_id, lottery_type_id, quantity }) => 
      [shop_id, lottery_type_id, quantity]
    );

    // Single bulk query
    await conn.query(
      `INSERT INTO orders (shop_id, lottery_type_id, quantity) 
       VALUES ? 
       ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
      [values] // Pass array of arrays for bulk insert
    );

    await conn.commit();
    return new Response(JSON.stringify({ message: 'Orders updated' }), { status: 200 });
  } catch (error) {
    if (conn) {
      await conn.rollback();
    }
    console.error('Error processing orders:', error); // Log for debugging
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  } finally {
    if (conn) conn.release(); // Ensure connection is always released
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