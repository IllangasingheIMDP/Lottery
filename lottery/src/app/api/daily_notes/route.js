import db from '@/lib/db';
import { authenticate } from '@/lib/auth';

// GET - Retrieve note for a specific date
export async function GET(req) {
    const auth = authenticate(req, ['samarakoonkumara@gmail.com']);
    if (auth.error) {
        return new Response(
            JSON.stringify({ error: auth.error }),
            { status: auth.status }
        );
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    try {
        const [rows] = await db.query(`
            SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, note
            FROM daily_notes
            WHERE date = ?
        `, [date]);

        if (rows.length === 0) {
            return new Response(JSON.stringify({ note: null }), { status: 200 });
        }

        return new Response(JSON.stringify({ note: rows[0].note }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
}

// POST - Create or update a note for a specific date
export async function POST(req) {
    const auth = authenticate(req, ['samarakoonkumara@gmail.com']);
    if (auth.error) {
        return new Response(
            JSON.stringify({ error: auth.error }),
            { status: auth.status }
        );
    }

    const { date, note } = await req.json();
    let conn;

    try {
        conn = await db.getConnection();
        await conn.beginTransaction();

        const query = `
            INSERT INTO daily_notes (date, note)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE note = VALUES(note)
        `;

        await conn.query(query, [date, note]);
        await conn.commit();
        return new Response(JSON.stringify({ message: 'Note updated successfully' }), { status: 200 });
    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Error saving note:', error);
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    } finally {
        if (conn) conn.release();
    }
}

// PUT - Update a specific note (same as POST in this case)
export async function PUT(req) {
    const auth = authenticate(req, ['samarakoonkumara@gmail.com']);
    if (auth.error) {
        return new Response(
            JSON.stringify({ error: auth.error }),
            { status: auth.status }
        );
    }

    const { date, note } = await req.json();
    let conn;

    try {
        conn = await db.getConnection();
        await conn.beginTransaction();

        const query = `
            UPDATE daily_notes
            SET note = ?
            WHERE date = ?
        `;

        await conn.query(query, [note, date]);
        await conn.commit();
        return new Response(JSON.stringify({ message: 'Note updated successfully' }), { status: 200 });
    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Error updating note:', error);
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    } finally {
        if (conn) conn.release();
    }
}

// DELETE - Delete a specific note
export async function DELETE(req) {
    const auth = authenticate(req, ['samarakoonkumara@gmail.com']);
    if (auth.error) {
        return new Response(
            JSON.stringify({ error: auth.error }),
            { status: auth.status }
        );
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    let conn;

    try {
        conn = await db.getConnection();
        await conn.beginTransaction();

        const query = `
            DELETE FROM daily_notes
            WHERE date = ?
        `;

        await conn.query(query, [date]);
        await conn.commit();
        return new Response(JSON.stringify({ message: 'Note deleted successfully' }), { status: 200 });
    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Error deleting note:', error);
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    } finally {
        if (conn) conn.release();
    }
}
