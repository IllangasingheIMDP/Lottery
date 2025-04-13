// lib/db.js
import 'dotenv/config';           // 1) load .env.local
import mysql from 'mysql2/promise';


// 2) Destructure & validate env‑vars


// 3) Load the CA cert


// 4) Create the pool (named `db`)
const db = mysql.createPool({
  uri: process.env.DB_URL,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  ssl: {
    ca: process.env.CA,
    rejectUnauthorized: true,  // secure
  },
});

// 5) Test connection on startup
(async () => {
  try {
    const conn = await db.getConnection();
    await conn.ping();
    conn.release();
    console.log('✅ MySQL pool connected');
  } catch (err) {
    console.error('❌ MySQL pool failed to connect:', err);
    process.exit(1);
  }
})();

export default db;
