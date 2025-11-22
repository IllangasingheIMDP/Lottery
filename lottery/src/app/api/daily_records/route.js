// app/api/daily_records/route.js
import { authenticate } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(req) {
  const auth = authenticate(req,['samarakoonkumara@gmail.com']);
  if (auth.error) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const shop_id = searchParams.get('shop_id');
  const date = searchParams.get('date');

  if (!shop_id || !date) {
    return new Response(JSON.stringify({ error: 'Missing required parameters' }), { status: 400 });
  }

  let conn;
  try {
    conn = await db.getConnection();
    const [rows] = await conn.query(
      'SELECT d.*,s.name FROM daily_records as d join shops as s on d.shop_id=s.id  WHERE shop_id = ? AND date = ?',
      [shop_id, date]
    );
    
    if (rows.length === 0) {
      // No record exists yet, return an empty template
      return new Response(JSON.stringify({
        shop_id,
        date,
        nlb: '{}',
        dlb: '{}',
        faulty: '{}'
      }), { status: 200 });
    }
    
    return new Response(JSON.stringify(rows[0]), { status: 200 });
  } catch (err) {
    console.error('GET /daily_records error:', err);
    return new Response(JSON.stringify({ error: 'Server error', details: err.message }), { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

export async function POST(req) {
  const auth = authenticate(req,['samarakoonkumara@gmail.com']);
  if (auth.error) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status });
  }

  const { id, step, data } = await req.json();
  
  if (!id || !step || !data) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    if (step === 1) {
      const { price_per_lottery, lottery_quantity } = data;
      const total_worth = price_per_lottery * lottery_quantity;
      await conn.query(
        'UPDATE daily_records SET price_per_lottery = ?, lottery_quantity = ?, total_worth = ?, step = 1 WHERE id = ?',
        [price_per_lottery, lottery_quantity, total_worth, id]);
    }


   else if (step === 2) {
      const { cash_given, got_tickets_total_price } = data;
      await conn.query(
        'UPDATE daily_records SET cash_given = ?, got_tickets_total_price = ?, step = 2 WHERE id = ?',
        [cash_given, got_tickets_total_price, id]
      );
    } else if (step === 3) {
      const nlb = JSON.stringify(data.nlb);
      const nlb_total_price = Object.entries(data.nlb).reduce(
        (sum, [price, count]) => sum + parseFloat(price) * count,
        0
      );
      await conn.query(
        'UPDATE daily_records SET nlb = ?, nlb_total_price = ?, step = 3 WHERE id = ?',
        [nlb, nlb_total_price, id]
      );
    } else if (step === 4) {
      const dlb = JSON.stringify(data.dlb);
      const dlb_total_price = Object.entries(data.dlb).reduce(
        (sum, [price, count]) => sum + parseFloat(price) * count,
        0
      );
      
      // Fetch the current record to check equality
      const [records] = await conn.query(
        'SELECT nlb_total_price, got_tickets_total_price FROM daily_records WHERE id = ?',
        [id]
      );
      
      if (records.length === 0) {
        throw new Error('Record not found');
      }
      
      const record = records[0];
      const nlb_total_price = Number(parseFloat(record.nlb_total_price || '0').toFixed(2));
      const got_tickets_total_price = Number(parseFloat(record.got_tickets_total_price || '0').toFixed(2));
      //console.log(nlb_total_price, got_tickets_total_price, dlb_total_price);
      // Calculate equality check (1 = true, 0 = false)
      const equality_check =  ((nlb_total_price+dlb_total_price) === got_tickets_total_price) ? 1 : 0;
      //console.log(nlb_total_price, got_tickets_total_price, dlb_total_price,equality_check);
      await conn.query(
        'UPDATE daily_records SET dlb = ?, dlb_total_price = ?, equality_check = ?, step = 4 WHERE id = ?',
        [dlb, dlb_total_price, equality_check, id]
      );
    } else if (step === 5) {
      const faulty = JSON.stringify(data.faulty);
      const faulty_total_price = Object.entries(data.faulty).reduce(
        (sum, [price, count]) => sum + parseFloat(price) * count,
        0
      );
      await conn.query(
        'UPDATE daily_records SET faulty = ?, faulty_total_price = ?, step = 5 WHERE id = ?',
        [faulty, faulty_total_price, id]
      );
    } else if (step === 6) {
      const { special_lotteries_note } = data;
      await conn.query(
        'UPDATE daily_records SET special_lotteries_note = ?, step = 6, completed = 1 WHERE id = ?',
        [special_lotteries_note, id]
      );
    }
    
    // Update balanced status after relevant steps (steps 2, 5, 6 can affect balance)
    if ([2, 5, 6].includes(step)) {
      const [records] = await conn.query(
        'SELECT total_worth, faulty_total_price, cash_given, got_tickets_total_price FROM daily_records WHERE id = ?',
        [id]
      );
      
      if (records.length > 0) {
        const record = records[0];
        const total_worth = Number(parseFloat(record.total_worth || '0').toFixed(2));
        const faulty_total_price = Number(parseFloat(record.faulty_total_price || '0').toFixed(2));
        const cash_given = Number(parseFloat(record.cash_given || '0').toFixed(2));
        const got_tickets_total_price = Number(parseFloat(record.got_tickets_total_price || '0').toFixed(2));
        
        const balanced = total_worth === (faulty_total_price + cash_given + got_tickets_total_price) ? 1 : 0;
        
        await conn.query(
          'UPDATE daily_records SET balanced = ? WHERE id = ?',
          [balanced, id]
        );
      }
    }

    await conn.commit();
    return new Response(JSON.stringify({ 
      message: `Step ${step} saved successfully`,
      id: id
    }), { status: 200 });
  } catch (error) {
    if (conn) await conn.rollback();
    console.error('POST /daily_records error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to save step', 
      details: error.message 
    }), { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}