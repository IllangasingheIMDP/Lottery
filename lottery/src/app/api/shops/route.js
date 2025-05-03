import db from '@/lib/db';
import { authenticate } from '@/lib/auth';

export async function GET(req) {
  const auth = authenticate(req,['samarakoonkumara@gmail.com','a@gmail.com']);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error }),
      { status: auth.status }
    );
  }

  try {
    // db.query() returns [rows, fields]
    const [shops] = await db.query('SELECT * FROM shops');
    return new Response(JSON.stringify(shops), { status: 200 });
  } catch (error) {
    console.error('GET /api/shops error:', error);
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  const auth = authenticate(req, ['samarakoonkumara@gmail.com']);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error }),
      { status: auth.status }
    );
  }

  try {
    const { id } = await req.json();
    await db.query('DELETE FROM shops WHERE id = ?', [id]);
    return new Response(JSON.stringify({ message: 'Shop deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error('DELETE /api/shops error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}

