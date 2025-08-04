import db from '@/lib/db';
import { authenticate } from '@/lib/auth';

export async function POST(req) {
  const auth = authenticate(req,['samarakoonkumara@gmail.com']);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error }),
      { status: auth.status }
    );
  }

  const { name, contact_number, address } = await req.json();

  try {
    await db.query(
      'INSERT INTO shops (name, contact_number, address, active) VALUES (?, ?, ?, TRUE)',
      [name, contact_number, address]
    );
    return new Response(
      JSON.stringify({ message: 'Shop added successfully' }),
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/shops error:', error);
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500 }
    );
  }
}