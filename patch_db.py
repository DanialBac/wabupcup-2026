import re

with open('server/db.ts', 'r') as f:
    content = f.read()

# 1. Add import pool from config
content = content.replace("import mysql from 'mysql2/promise';", "import { pool } from './config';")

# 2. Remove loadLocalStore and persistLocalStore logic and just define them as no-ops
# Remove everything from `const LOCAL_STORE_FILE` up to `let pool: mysql.Pool | null = null;`
pattern1 = re.compile(r'const LOCAL_STORE_FILE.*?(?=let pool: mysql\.Pool \| null = null;)', re.DOTALL)
content = pattern1.sub('export function loadLocalStore(): void {}\nexport function persistLocalStore(): void {}\n', content)

# 3. Remove let pool: mysql.Pool... down to `export function getMySqlStatus()`
pattern2 = re.compile(r'let pool: mysql\.Pool.*?(?=export function getMySqlStatus\(\) \{)', re.DOTALL)
content = pattern2.sub('let isMySqlConnected = false;\nlet mySqlError: string | null = null;\n\n', content)

# 4. Modify getMySqlStatus
pattern3 = re.compile(r'export function getMySqlStatus\(\) \{.*?\}\n', re.DOTALL)
content = pattern3.sub('''export function getMySqlStatus() {
  return {
    connected: isMySqlConnected,
    host: process.env.TIDB_HOST || 'From ENV',
    database: process.env.TIDB_DATABASE || 'wabupcup2026',
    error: mySqlError,
    mode: isMySqlConnected ? 'MYSQL_REAL' : 'MEMORY_FALLBACK',
    stats: {
      categoriesCount: memStore.categories.length,
      registrationsCount: memStore.registrations.length,
      matchesCount: memStore.matches.length,
      sponsorsCount: memStore.sponsors.length,
      adminsCount: memStore.adminUsers.length,
    },
  };
}
''', content)

# 5. Remove resolveSslConfig and CustomDbConfig down to `export async function ensureDbConnected()`
pattern4 = re.compile(r'function resolveSslConfig.*?let dbInitPromise: Promise<boolean> \| null = null;\n', re.DOTALL)
content = pattern4.sub('let dbInitPromise: Promise<boolean> | null = null;\n', content)

# 6. Rewrite ensureDbConnected and initDatabaseConnection
pattern5 = re.compile(r'export async function ensureDbConnected\(\).*?(?=async function autoMigrateTables\(\) \{)', re.DOTALL)
content = pattern5.sub('''export async function ensureDbConnected(): Promise<boolean> {
  if (isMySqlConnected) return true;
  if (!dbInitPromise) {
    dbInitPromise = initDatabaseConnection().finally(() => { dbInitPromise = null; });
  }
  try {
    return await dbInitPromise;
  } catch {
    return isMySqlConnected;
  }
}

export async function initDatabaseConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    isMySqlConnected = true;
    mySqlError = null;
    await autoMigrateTables();
    return true;
  } catch (err: any) {
    isMySqlConnected = false;
    mySqlError = err?.message || 'Failed to connect to TiDB';
    console.error('[MySQL Warning] Could not connect:', mySqlError);
    return false;
  }
}

''', content)

# Replace any lingering mysql references if needed
# We need to make sure we don't have pool as any etc
# Let's write the patched content back
with open('server/db.ts', 'w') as f:
    f.write(content)

