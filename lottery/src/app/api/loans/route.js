import db from '@/lib/db';
import { authenticate } from '@/lib/auth';

export async function GET(req) {
    const auth = authenticate(req, ['samarakoonkumara@gmail.com', 'a@gmail.com']);
    if (auth.error) {
        return new Response(
            JSON.stringify({ error: auth.error }),
            { status: auth.status }
        );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    // Route to GET_LOAN_RECORDS if type is loan_records
    if (type === 'loan_records') {
        return GET_LOAN_RECORDS(req);
    }

    // Original GET logic for shop loans
    const shopId = searchParams.get('shop_id');
    if (!shopId) {
        return new Response(
            JSON.stringify({ error: 'Shop ID is required' }),
            { status: 400 }
        );
    }

    try {
        const { searchParams } = new URL(req.url);
        const shopId = searchParams.get('shop_id');
        console.log(shopId);
        if (!shopId) {
            return new Response(
                JSON.stringify({ error: 'Shop ID is required' }),
                { status: 400 }
            );
        }

        // Calculate unbalanced amount for the shop
        const [result] = await db.query(`
            SELECT 
                SUM(total_worth - (cash_given + COALESCE(nlb_total_price, 0) + COALESCE(dlb_total_price, 0) + COALESCE(faulty_total_price, 0))) as unbalanced_amount
            FROM daily_records 
            WHERE shop_id = ?
            AND balanced = 0
            AND date >= '2025-05-12'
        `, [shopId]);

        const unbalancedAmount = result[0]?.unbalanced_amount || 0;

        return new Response(
            JSON.stringify({ 
                shop_id: shopId,
                unbalanced_amount: unbalancedAmount
            }),
            { status: 200 }
        );

    } catch (error) {
        console.error('GET /api/loans error:', error);
        return new Response(
            JSON.stringify({ error: 'Server error' }),
            { status: 500 }
        );
    }
}

export async function POST(req) {
    const auth = authenticate(req, ['samarakoonkumara@gmail.com']);
    if (auth.error) {
        return new Response(
            JSON.stringify({ error: auth.error }),
            { status: auth.status }
        );
    }

    try {
        const { shop_id, amount, payment_date } = await req.json();

        if (!shop_id || !amount || !payment_date) {
            return new Response(
                JSON.stringify({ error: 'Shop ID, amount, and payment date are required' }),
                { status: 400 }
            );
        }

        // Check for existing loan record for the same day
        const [existingLoan] = await db.query(`
            SELECT id, amount 
            FROM loan_records 
            WHERE shop_id = ? 
            AND DATE(payment_date) = DATE(?)
        `, [shop_id, payment_date]);

        // Get unbalanced records ordered by date
        const [records] = await db.query(`
            SELECT 
                id,
                date,
                total_worth,
                cash_given,
                COALESCE(nlb_total_price, 0) as nlb_total_price,
                COALESCE(dlb_total_price, 0) as dlb_total_price,
                COALESCE(faulty_total_price, 0) as faulty_total_price
            FROM daily_records 
            WHERE shop_id = ?
            AND balanced = 0
            AND date >= '2025-05-12'
            ORDER BY date ASC
        `, [shop_id]);
        console.log("unbalanced records",records);
        let remainingAmount = amount;
        const updatedRecords = [];

        // Process each record
        for (const record of records) {
            if (remainingAmount <= 0) break;

            const currentUnbalanced = Number(record.total_worth) - 
                (Number(record.cash_given) + Number(record.nlb_total_price) + Number(record.dlb_total_price) + Number(record.faulty_total_price));
            console.log("currentUnbalanced",currentUnbalanced);
            if (currentUnbalanced > 0) {
                const paymentAmount = Math.min(remainingAmount, currentUnbalanced);
                const newCashGiven = Number(record.cash_given) + paymentAmount;
                const isBalanced = paymentAmount >= currentUnbalanced;
                console.log("isBalanced",isBalanced);
                console.log("paymentAmount",paymentAmount);
                
                console.log("newCashGiven",newCashGiven);
                // Update the record
                await db.query(`
                    UPDATE daily_records 
                    SET 
                        cash_given = ?,
                        balanced = ?
                    WHERE id = ?
                `, [newCashGiven, isBalanced ? 1 : 0, record.id]);
                console.log("updated record",record.id);
                // Add to updated records
                updatedRecords.push({
                    record_id: record.id,
                    date: record.date,
                    payment_amount: paymentAmount,
                    is_balanced: isBalanced
                });

                remainingAmount -= paymentAmount;
            }
        }

        // Update or insert loan record
        if (existingLoan && existingLoan[0]) {
            // Add to existing loan
            const newAmount = existingLoan[0].amount + parseFloat(amount);
            await db.query(`
                UPDATE loan_records 
                SET amount = ?
                WHERE id = ?
            `, [newAmount, existingLoan[0].id]);
        } else {
            // Create new loan record
            await db.query(`
                INSERT INTO loan_records (shop_id, amount, payment_date)
                VALUES (?, ?, ?)
            `, [shop_id, amount, payment_date]);
        }

        return new Response(
            JSON.stringify({
                shop_id,
                total_payment: amount,
                payment_date,
                remaining_amount: remainingAmount,
                updated_records: updatedRecords,
                is_additional: !!existingLoan?.[0]
            }),
            { status: 200 }
        );

    } catch (error) {
        console.error('POST /api/loans error:', error);
        return new Response(
            JSON.stringify({ error: 'Server error' }),
            { status: 500 }
        );
    }
}

// Add this new function after the existing POST function
export async function GET_LOAN_RECORDS(req) {
    const auth = authenticate(req, ['samarakoonkumara@gmail.com', 'a@gmail.com']);
    if (auth.error) {
        return new Response(
            JSON.stringify({ error: auth.error }),
            { status: auth.status }
        );
    }

    try {
        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date');
        const type = searchParams.get('type');

        if (!date) {
            return new Response(
                JSON.stringify({ error: 'Date is required' }),
                { status: 400 }
            );
        }

        // Get all loan records for the specified date with shop details
        const [loanRecords] = await db.query(`
            SELECT 
                lr.id,
                lr.shop_id,
                s.name as shop_name,
                lr.amount,
                lr.payment_date
            FROM loan_records lr
            JOIN shops s ON lr.shop_id = s.id
            WHERE DATE(lr.payment_date) = DATE(?)
            ORDER BY s.name ASC
        `, [date]);

        // Calculate total amount for the day
        const totalAmount = loanRecords.reduce((sum, record) => sum + record.amount, 0);

        return new Response(
            JSON.stringify({ 
                date: date,
                total_amount: totalAmount,
                records: loanRecords
            }),
            { status: 200 }
        );

    } catch (error) {
        console.error('GET_LOAN_RECORDS /api/loans error:', error);
        return new Response(
            JSON.stringify({ error: 'Server error' }),
            { status: 500 }
        );
    }
}
