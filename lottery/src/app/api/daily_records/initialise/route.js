// app/api/daily_records/initialise/route.js
import { authenticate } from '@/lib/auth';
import db from '@/lib/db';

export async function POST(req) {
  const auth = authenticate(req,['samarakoonkumara@gmail.com']);
  if (auth.error) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status });
  }

  const body = await req.json();
  const { shop_id, date, data } = body;
  
  if (!shop_id || !date || !data) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // Check if a record already exists for this shop and date
    const [existingRecords] = await conn.query(
      'SELECT id FROM daily_records WHERE shop_id = ? AND date = ?',
      [shop_id, date]
    );

    if (existingRecords.length > 0) {
      // Record exists, return its ID
      const recordId = existingRecords[0].id;
      
      // Update the existing record with step 1 data
      const { price_per_lottery, lottery_quantity } = data;
      const total_worth = price_per_lottery * lottery_quantity;
      
      await conn.query(
        'UPDATE daily_records SET price_per_lottery = ?, lottery_quantity = ?, total_worth = ?, step = 1 WHERE id = ?',
        [price_per_lottery, lottery_quantity, total_worth, recordId]
      );
      
      await conn.commit();
      return new Response(JSON.stringify({ 
        recordId: recordId, 
        message: 'Record updated successfully' 
      }), { status: 200 });
    } else {
      // Create a new record
      const { price_per_lottery, lottery_quantity } = data;
      const total_worth = price_per_lottery * lottery_quantity;
      
      const [result] = await conn.query(
        'INSERT INTO daily_records (shop_id, date, price_per_lottery, lottery_quantity, total_worth, step, completed) VALUES (?, ?, ?, ?, ?, 1, 0)',
        [shop_id, date, price_per_lottery, lottery_quantity, total_worth]
      );
      
      const insertedId = result.insertId;
      
      await conn.commit();
      return new Response(JSON.stringify({ 
        recordId: insertedId, 
        message: 'New record created successfully' 
      }), { status: 201 });
    }
  } catch (error) {
    if (conn) await conn.rollback();
    console.error('POST /daily_records/initialise error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to save record', 
      details: error.message 
    }), { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}