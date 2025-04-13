// app/api/auth/logout/route.js
export async function POST(req) {
    try {
      // Clear the authentication cookie
      return new Response(
        JSON.stringify({ message: 'Logged out successfully' }),
        {
          status: 200,
          headers: {
            'Set-Cookie': 'token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
          },
        }
      );
    } catch (error) {
      console.error('POST /api/auth/logout error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to log out', details: error.message }),
        { status: 500 }
      );
    }
  }