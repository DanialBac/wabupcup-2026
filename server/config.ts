import 'dotenv/config'; // Fallback to dotenv if --env-file is not used
import mysql from 'mysql2/promise';

// 1. Validate environment variables
const dbUrl = process.env.DATABASE_URL;
const tidbHost = process.env.TIDB_HOST || process.env.MYSQL_HOST;
const tidbPort = process.env.TIDB_PORT || process.env.MYSQL_PORT || '4000';
const tidbUser = process.env.TIDB_USER || process.env.MYSQL_USER;
const tidbPassword = process.env.TIDB_PASSWORD || process.env.MYSQL_PASSWORD;
const tidbDatabase = process.env.TIDB_DATABASE || process.env.MYSQL_DATABASE;

if (!dbUrl) {
  if (!tidbHost) throw new Error("Missing env TIDB_HOST or MYSQL_HOST");
  if (!tidbUser) throw new Error("Missing env TIDB_USER or MYSQL_USER");
  if (!tidbPassword) throw new Error("Missing env TIDB_PASSWORD or MYSQL_PASSWORD");
  if (!tidbDatabase) throw new Error("Missing env TIDB_DATABASE or MYSQL_DATABASE");
}

// 2. Configure connection options
const sslOptions = {
  minVersion: 'TLSv1.2',
  rejectUnauthorized: true,
};

// Clean non-standard query parameters like ?sslaccept=strict that trigger MySQL2 warnings
const cleanedDbUrl = dbUrl
  ? dbUrl.replace(/([?&])sslaccept=[^&]*(&|$)/g, (_m, p1, p2) => (p1 === '?' && p2 ? '?' : '')).replace(/[?&]$/, '')
  : dbUrl;

const poolConfig: mysql.PoolOptions = cleanedDbUrl
  ? {
      uri: cleanedDbUrl,
      ssl: sslOptions,
      connectionLimit: 5,
      enableKeepAlive: true,
      idleTimeout: 60000,
    }
  : {
      host: tidbHost,
      port: parseInt(tidbPort, 10),
      user: tidbUser,
      password: tidbPassword,
      database: tidbDatabase,
      ssl: sslOptions,
      connectionLimit: 5,
      enableKeepAlive: true,
      idleTimeout: 60000,
    };

// 3. Create the pool ONCE
export const pool = mysql.createPool(poolConfig);

// 4. Export helpers
export async function withConnection<T>(cb: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    return await cb(conn);
  } finally {
    conn.release();
  }
}

export async function withTransaction<T>(cb: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const result = await cb(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
