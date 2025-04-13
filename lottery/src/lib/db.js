// lib/db.js
import 'dotenv/config';           // 1) load .env.local
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// 2) Destructure & validate env‑vars
const {
  DB_HOST,
  DB_PORT,
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  SSL_CA_PATH = 'ca.pem',
} = process.env;
if (!DB_HOST || !DB_PORT || !DB_NAME || !DB_USER || !DB_PASSWORD) {
  console.error('❌ Missing one of DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
  
}

// 3) Load the CA cert
const caPath = path.resolve(process.cwd(), SSL_CA_PATH);
let ca;
try {
  ca = fs.readFileSync(caPath);
} catch (err) {
  console.error('❌ Cannot load CA cert at', caPath, err.message);
  process.exit(1);
}

// 4) Create the pool (named `db`)
const db = mysql.createPool({
  uri: process.env.DB_URL,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  ssl: {
    ca,
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
