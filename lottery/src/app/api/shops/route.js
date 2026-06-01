import db from '@/lib/db';
import { authenticate } from '@/lib/auth';
import redis from '@/lib/redis';

export async function GET(req) {
  const auth = authenticate(req,['samarakoonkumara@gmail.com']);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error }),
      { status: auth.status }
    );
  }

  try {
    // Modified to only return active shops by default
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const cacheKey = includeInactive ? 'cache:shops:all' : 'cache:shops:active';
    const cachedShops = await redis.get(cacheKey);

    if (cachedShops) {
      return new Response(cachedShops, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const query = includeInactive 
      ? 'SELECT * FROM shops'
      : 'SELECT * FROM shops WHERE active = TRUE';

    const [shops] = await db.query(query);
    const shopsJson = JSON.stringify(shops);

    // Cache for 24 hours (86400 seconds)
    await redis.set(cacheKey, shopsJson, { EX: 86400 });

    return new Response(shopsJson, { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
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
    // Instead of deleting, update the active status
    await db.query('UPDATE shops SET active = FALSE WHERE id = ?', [id]);

    // Invalidate caches
    await redis.del(['cache:shops:active', 'cache:shops:all']);

    return new Response(
      JSON.stringify({ message: 'Shop deactivated successfully' }), 
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/shops error:', error);
    return new Response(
      JSON.stringify({ error: 'Server error' }), 
      { status: 500 }
    );
  }
}

// Add new endpoint to reactivate shops
export async function PATCH(req) {
  const auth = authenticate(req, ['samarakoonkumara@gmail.com']);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error }),
      { status: auth.status }
    );
  }

  try {
    const { id, active } = await req.json();
    await db.query('UPDATE shops SET active = ? WHERE id = ?', [active, id]);
    
    // Invalidate caches
    await redis.del(['cache:shops:active', 'cache:shops:all']);

    return new Response(
      JSON.stringify({ 
        message: active ? 'Shop activated successfully' : 'Shop deactivated successfully' 
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('PATCH /api/shops error:', error);
    return new Response(
      JSON.stringify({ error: 'Server error' }), 
      { status: 500 }
    );
  }
}

// Update shop details (name, contact_number, address)
export async function PUT(req) {
  const auth = authenticate(req, ['samarakoonkumara@gmail.com']);
  if (auth.error) {
    return new Response(
      JSON.stringify({ error: auth.error }),
      { status: auth.status }
    );
  }

  try {
    const { id, name, contact_number, address } = await req.json();

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Shop id is required' }),
        { status: 400 }
      );
    }

    // Use COALESCE to support partial updates
    await db.query(
      `UPDATE shops
       SET 
         name = COALESCE(?, name),
         contact_number = COALESCE(?, contact_number),
         address = COALESCE(?, address)
       WHERE id = ?`,
      [name ?? null, contact_number ?? null, address ?? null, id]
    );

    // Invalidate caches
    await redis.del(['cache:shops:active', 'cache:shops:all']);

    return new Response(
      JSON.stringify({ message: 'Shop updated successfully' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('PUT /api/shops error:', error);
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500 }
    );
  }
}

