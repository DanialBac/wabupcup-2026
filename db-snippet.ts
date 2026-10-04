if (initialSavedDbConfig) {
  if (initialSavedDbConfig.databaseUrl && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = initialSavedDbConfig.databaseUrl.trim();
  }
  if (initialSavedDbConfig.host && !process.env.MYSQL_HOST) {
    process.env.MYSQL_HOST = initialSavedDbConfig.host.trim();
  }
  if (initialSavedDbConfig.port && !process.env.MYSQL_PORT) {
    process.env.MYSQL_PORT = String(initialSavedDbConfig.port);
  }
  if (initialSavedDbConfig.user && !process.env.MYSQL_USER) {
    process.env.MYSQL_USER = initialSavedDbConfig.user.trim();
  }
  if (initialSavedDbConfig.password && !process.env.MYSQL_PASSWORD) {
    process.env.MYSQL_PASSWORD = initialSavedDbConfig.password;
  }
  if (initialSavedDbConfig.database && !process.env.MYSQL_DATABASE) {
    process.env.MYSQL_DATABASE = initialSavedDbConfig.database.trim();
  }
  if (initialSavedDbConfig.ssl !== undefined && !process.env.MYSQL_SSL) {
    process.env.MYSQL_SSL = initialSavedDbConfig.ssl ? 'true' : 'false';
  }
}

export function saveDbConfigFile(config: CustomDbConfig): void {
  try {
    fs.writeFileSync(DB_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
    console.log('[DB Config] Successfully saved database configuration to', DB_CONFIG_FILE);
  } catch (err) {
    console.warn('[DB Config] Could not write config to file:', err);
  }
}

export function getMySqlStatus() {
  const host = process.env.MYSQL_HOST || (process.env.DATABASE_URL ? 'Via DATABASE_URL' : 'Not configured (In-Memory fallback)');
  const dbName = process.env.MYSQL_DATABASE || 'wabupcup2026';
  return {
    connected: isMySqlConnected,
    host,
    database: dbName,
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

function resolveSslConfig(urlOrHost?: string, explicitSsl?: boolean): any {
  // If explicitly disabled with false or 0
  if (process.env.MYSQL_SSL === 'false' || process.env.MYSQL_SSL === '0') {
    return undefined;
  }

  // Auto-detect cloud providers that strictly require SSL / TLS 1.2+
  const isCloudHost =
    urlOrHost &&
    (urlOrHost.includes('tidbcloud.com') ||
      urlOrHost.includes('psdb.cloud') ||
      urlOrHost.includes('aivencloud.com') ||
      urlOrHost.includes('railway.app') ||
      urlOrHost.includes('amazonaws.com') ||
      urlOrHost.includes('supabase.co') ||
      urlOrHost.includes('cockroachlabs.cloud'));

  const needsSsl =
    explicitSsl ||
    Boolean(isCloudHost) ||
    process.env.MYSQL_SSL === 'true' ||
    process.env.MYSQL_SSL === '1' ||
    Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.includes('ssl'));

  if (needsSsl) {
    // rejectUnauthorized: false is essential in serverless environments (Vercel) for managed cloud databases (TiDB Cloud)
    const rejectUnauthorized = process.env.MYSQL_SSL_REJECT_UNAUTHORIZED === 'true';
    return {
      minVersion: 'TLSv1.2',
      rejectUnauthorized,
    };
  }

  return undefined;
}

export interface CustomDbConfig {
  databaseUrl?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
}

let dbInitPromise: Promise<boolean> | null = null;

export async function ensureDbConnected(): Promise<boolean> {
  if (isMySqlConnected && pool) {
    return true;
  }
  const savedCfg = loadSavedDbConfig();
  const dbUrl = (process.env.DATABASE_URL || savedCfg?.databaseUrl || '').trim();
  const host = (process.env.MYSQL_HOST || savedCfg?.host || '').trim();
  if (!dbUrl && !host) {
    return false;
  }

  if (!dbInitPromise) {
    dbInitPromise = initDatabaseConnection().finally(() => {
      dbInitPromise = null;
    });
  }

  // Guarantee max 3.5 seconds wait time to prevent Vercel Serverless Function timeouts
  const timeoutPromise = new Promise<boolean>((resolve) => {
    setTimeout(() => resolve(isMySqlConnected), 3500);
  });

  try {
    return await Promise.race([dbInitPromise, timeoutPromise]);
  } catch {
    return isMySqlConnected;
  }
}

export async function initDatabaseConnection(customConfig?: CustomDbConfig): Promise<boolean> {
  // If no customConfig provided, check if we have a saved config on disk
  const effectiveConfig = customConfig || loadSavedDbConfig();

  if (effectiveConfig) {
    if (effectiveConfig.databaseUrl !== undefined && effectiveConfig.databaseUrl.trim()) {
      process.env.DATABASE_URL = effectiveConfig.databaseUrl.trim();
    }
    if (effectiveConfig.host !== undefined && effectiveConfig.host.trim()) {
      process.env.MYSQL_HOST = effectiveConfig.host.trim();
    }
    if (effectiveConfig.port !== undefined) {
      process.env.MYSQL_PORT = String(effectiveConfig.port);
    }
    if (effectiveConfig.user !== undefined && effectiveConfig.user.trim()) {
      process.env.MYSQL_USER = effectiveConfig.user.trim();
    }
    if (effectiveConfig.password !== undefined) {
      process.env.MYSQL_PASSWORD = effectiveConfig.password;
    }
    if (effectiveConfig.database !== undefined && effectiveConfig.database.trim()) {
      process.env.MYSQL_DATABASE = effectiveConfig.database.trim();
    }
    if (effectiveConfig.ssl !== undefined) {
      process.env.MYSQL_SSL = effectiveConfig.ssl ? 'true' : 'false';
    }
  }

  const dbUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.trim() : undefined;
  const host = process.env.MYSQL_HOST ? process.env.MYSQL_HOST.trim() : undefined;
  const user = process.env.MYSQL_USER ? process.env.MYSQL_USER.trim() : undefined;
  const password = process.env.MYSQL_PASSWORD !== undefined ? process.env.MYSQL_PASSWORD : undefined;
  const database = (process.env.MYSQL_DATABASE || 'wabupcup2026').trim();
  const isTidb = Boolean((dbUrl && dbUrl.includes('tidbcloud.com')) || (host && host.includes('tidbcloud.com')));
  const defaultPort = isTidb ? 4000 : 3306;
  const port = parseInt(process.env.MYSQL_PORT || String(defaultPort), 10);
  const useSsl = process.env.MYSQL_SSL === 'true' || process.env.MYSQL_SSL === '1' || isTidb;

  if (!dbUrl && !host) {
    console.log('[Database] No MySQL host or DATABASE_URL provided. Operating with in-memory persistence layer.');
    isMySqlConnected = false;
    mySqlError = 'Belum dikonfigurasi. Silakan atur kredensial database di tab Database.';
    return false;
  }

  try {
    let poolOptions: mysql.PoolOptions;

    if (dbUrl) {
      const ssl = resolveSslConfig(dbUrl, useSsl || isTidb);
      try {
        // Parse DATABASE_URL for fine-tuned PoolOptions with guaranteed SSL handling
        const parsedUrl = new URL(dbUrl);
        const urlDbName = parsedUrl.pathname.replace(/^\/+/, '') || database;
        const urlPort = parsedUrl.port ? parseInt(parsedUrl.port, 10) : (isTidb ? 4000 : 3306);
        poolOptions = {
          host: parsedUrl.hostname,
          port: urlPort,
          user: decodeURIComponent(parsedUrl.username),
          password: decodeURIComponent(parsedUrl.password),
          database: urlDbName,
          waitForConnections: true,
          connectionLimit: 4,
          maxIdle: 2,
          idleTimeout: 30000,
          enableKeepAlive: true,
          keepAliveInitialDelay: 10000,
          connectTimeout: 5000,
          queueLimit: 0,
          ssl: ssl || (isTidb ? { minVersion: 'TLSv1.2', rejectUnauthorized: false } : undefined),
        };
      } catch {
        // If not a standard URL object, pass uri with ssl option
        poolOptions = {
          uri: dbUrl,
          waitForConnections: true,
          connectionLimit: 4,
          maxIdle: 2,
          idleTimeout: 30000,
          enableKeepAlive: true,
          keepAliveInitialDelay: 10000,
          connectTimeout: 5000,
          queueLimit: 0,
          ssl,
        };
      }
    } else {
      const ssl = resolveSslConfig(host, useSsl || isTidb);
      poolOptions = {
        host,
        user,
        password,
        database,
        port: port || (isTidb ? 4000 : 3306),
        waitForConnections: true,
        connectionLimit: 4,
        maxIdle: 2,
        idleTimeout: 30000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        connectTimeout: 5000,
        queueLimit: 0,
        ssl: ssl || (isTidb ? { minVersion: 'TLSv1.2', rejectUnauthorized: false } : undefined),
      };
    }

    try {
      // Close previous pool if exists
      if (pool) {
        try { await pool.end(); } catch {}
      }
      pool = mysql.createPool(poolOptions);
      (pool as any).on?.('error', (poolErr: any) => {
        console.warn('[MySQL Pool Non-fatal Event]', poolErr?.message || poolErr);
      });
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
    } catch (connErr: any) {
      // If error is Unknown database (ER_BAD_DB_ERROR / 1049), try connecting to default 'test' and creating db
      const isBadDb =
        connErr?.code === 'ER_BAD_DB_ERROR' ||
        connErr?.errno === 1049 ||
        (connErr?.message && connErr.message.toLowerCase().includes('unknown database'));

      if (isBadDb) {
        console.log(`[MySQL] Database "${database}" does not exist yet. Attempting to create automatically...`);
        try {
          const tempOptions = { ...poolOptions, database: isTidb ? 'test' : undefined, connectTimeout: 3000 };
          const tempConn = await mysql.createConnection(tempOptions as any);
          (tempConn as any).on?.('error', (err: any) => console.warn('[MySQL Temp Connection Event]', err?.message));
          await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4;`);
          await tempConn.end();

          // Re-create pool with the now existing database
          pool = mysql.createPool(poolOptions);
          (pool as any).on?.('error', (poolErr: any) => {
            console.warn('[MySQL Pool Non-fatal Event]', poolErr?.message || poolErr);
          });
          const connection = await pool.getConnection();
          await connection.ping();
          connection.release();
          console.log(`[MySQL] Database "${database}" created and connected successfully.`);
        } catch (createErr: any) {
          console.warn('[MySQL] Auto-create database fallback warning:', createErr?.message);
          // If CREATE DATABASE failed, connect using 'test' database in TiDB
          if (isTidb) {
            const fallbackOptions = { ...poolOptions, database: 'test' };
            pool = mysql.createPool(fallbackOptions);
            (pool as any).on?.('error', (poolErr: any) => {
              console.warn('[MySQL Pool Non-fatal Event]', poolErr?.message || poolErr);
            });
            const connection = await pool.getConnection();
            await connection.ping();
            connection.release();
          } else {
            throw connErr;
          }
        }
      } else {
        throw connErr;
      }
    }

    isMySqlConnected = true;
    mySqlError = null;
    console.log(`[MySQL] Successfully connected to MySQL database: ${database} at ${host || 'DATABASE_URL'}`);

    // If custom config was successfully connected, save to persistent config file
    if (customConfig) {
      saveDbConfigFile(customConfig);
    }

    // Auto-check and setup tables if needed
    await autoMigrateTables();
    return true;
  } catch (err: any) {
    isMySqlConnected = false;
    
    // Human-friendly Indonesian error messages for common database issues
    if (err?.code === 'ER_ACCESS_DENIED_ERROR' || err?.errno === 1045) {
      mySqlError = `Akses Ditolak (ER_ACCESS_DENIED): Password atau Username database tidak cocok. Silakan periksa atau buat ulang password di dashboard database online Anda (misal TiDB Cloud Console).`;
    } else if (err?.code === 'ENOTFOUND') {
      mySqlError = `Host Tidak Ditemukan (ENOTFOUND): Hostname '${host || 'DATABASE_URL'}' tidak dapat dihubungi. Periksa URL koneksi database.`;
    } else if (err?.code === 'ETIMEDOUT') {
      mySqlError = `Koneksi Timeout (ETIMEDOUT): Server database tidak merespons. Pastikan IP Allowlist diatur ke 0.0.0.0/0.`;
    } else {
      mySqlError = err?.message || 'Gagal terhubung ke MySQL';
    }
    
    console.warn(`[MySQL Warning] Could not connect to MySQL: ${mySqlError}. Using fallback storage.`);
    return false;
  }
}

async function autoMigrateTables() {
  if (!pool || !isMySqlConnected) return;

  try {
    // Always run schema initialization (all queries use CREATE TABLE IF NOT EXISTS)
    // to guarantee that new tables like table_players, tournament_groups, app_media_storage exist in pre-existing databases.
    await runFullSchemaInit();
