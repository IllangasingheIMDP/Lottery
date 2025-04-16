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
    // db.query() returns [rows, fields]
    const [rows] = await db.query('SELECT username FROM users WHERE gmail = ?', [auth.user.gmail]);
    const user = rows[0];
    
    return new Response(JSON.stringify(user), { status: 200 });
  }catch (error) {
    console.error('GET /api/user error:', error);
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500 }
    );
  }
}