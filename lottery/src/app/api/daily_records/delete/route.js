// src/app/api/auth/login/route.js
import { authenticate } from '@/lib/auth';
import db from '@/lib/db'; // this is your mysql2/promise pool

export async function POST(req) {
  // 1) auth guard
  const auth = authenticate(req,['samarakoonkumara@gmail.com']);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error }),
      { status: auth.status }
    );
  }

  // 2) parse body
  const { shopId,date } = await req.json();
  console.log(shopId,date);

  let conn;
  try {
    
    conn = await db.getConnection();
    await conn.beginTransaction();
    const query='DELETE FROM daily_records WHERE (shop_id = ?) and (date = ?)';
    const result=await conn.query(query,[shopId,date]);
    console.log(result);
    

    await conn.commit();
    return new Response(
      JSON.stringify({ message: `Record deleted saved successfully` }),
      { status: 200 }
    );

  } catch (error) {
    // 6) rollback on error
    if (conn) await conn.rollback();
    console.error('Transaction error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete record', details: error.message }),
      { status: 500 }
    );

  } finally {
    // 7) always release the connection
    if (conn) conn.release();
  }
}
