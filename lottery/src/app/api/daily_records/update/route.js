// src/app/api/auth/login/route.js
import { authenticate } from '@/lib/auth';
import db from '@/lib/db'; // this is your mysql2/promise pool

export async function POST(req) {
  // 1) auth guard
  const auth = authenticate(req);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error }),
      { status: auth.status }
    );
  }

  // 2) parse body
  const { id, step, data } = await req.json();

  let conn;
  try {
    // 3) get a dedicated connection & start transaction
    conn = await db.getConnection();
    await conn.beginTransaction();

    // 4) perform the correct step
    if (step === 1) {
      const { price_per_lottery, lottery_quantity } = data;
      const total_worth = price_per_lottery * lottery_quantity;
      await conn.query(
        `UPDATE daily_records
           SET price_per_lottery = ?, lottery_quantity = ?, total_worth = ?
         WHERE id = ?`,
        [price_per_lottery, lottery_quantity, total_worth, id]
      );

    } else if (step === 2) {
      const { cash_given, got_tickets_total_price } = data;
      await conn.query(
        `UPDATE daily_records
           SET cash_given = ?, got_tickets_total_price = ?
         WHERE id = ?`,
        [cash_given, got_tickets_total_price, id]
      );

    } else if (step === 3) {
      const nlb = JSON.stringify(data.nlb);
      const nlb_total_price = Object.entries(data.nlb)
        .reduce((sum, [price, count]) => sum + parseFloat(price) * count, 0);
      await conn.query(
        `UPDATE daily_records
           SET nlb = ?, nlb_total_price = ?
         WHERE id = ?`,
        [nlb, nlb_total_price, id]
      );

    } else if (step === 4) {
      const dlb = JSON.stringify(data.dlb);
      const dlb_total_price = Object.entries(data.dlb)
        .reduce((sum, [price, count]) => sum + parseFloat(price) * count, 0);

      // **correct destructuring**: rows is an array of row objects
      const [rows] = await conn.query(
        `SELECT nlb_total_price, got_tickets_total_price
           FROM daily_records
          WHERE id = ?`,
        [id]
      );
      const record = rows[0] || { nlb_total_price: 0, got_tickets_total_price: 0 };

      const equality_check =
        record.nlb_total_price + dlb_total_price === record.got_tickets_total_price
          ? 1
          : 0;

      await conn.query(
        `UPDATE daily_records
           SET dlb = ?, dlb_total_price = ?, equality_check = ?
         WHERE id = ?`,
        [dlb, dlb_total_price, equality_check, id]
      );

    } else if (step === 5) {
      const faulty = JSON.stringify(data.faulty);
      await conn.query(
        `UPDATE daily_records
           SET faulty = ?
         WHERE id = ?`,
        [faulty, id]
      );

    } else if (step === 6) {
      const { special_lotteries_note } = data;
      await conn.query(
        `UPDATE daily_records
           SET special_lotteries_note = ?
         WHERE id = ?`,
        [special_lotteries_note, id]
      );
    }

    // 5) commit & return
    await conn.commit();
    return new Response(
      JSON.stringify({ message: `Step ${step} saved successfully` }),
      { status: 200 }
    );

  } catch (error) {
    // 6) rollback on error
    if (conn) await conn.rollback();
    console.error('Transaction error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to save step', details: error.message }),
      { status: 500 }
    );

  } finally {
    // 7) always release the connection
    if (conn) conn.release();
  }
}
