import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import db from '@/lib/db';

export async function POST(req) {
  const { gmail, password } = await req.json();
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE gmail = ?', [gmail]);
    if (!rows) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
    }
    const token = jwt.sign({ gmail: user.gmail }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const response = new Response(JSON.stringify({ message: 'Login successful' }), { status: 200 });
    response.headers.set(
      'Set-Cookie',
      `token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Strict; ${process.env.NODE_ENV === 'production' ? 'Secure' : ''}`
    );
    return response;
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}