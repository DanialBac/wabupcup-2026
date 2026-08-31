import mysql from 'mysql2/promise';
import {
  INITIAL_ADMIN_USERS,
  INITIAL_CATEGORIES,
  INITIAL_MATCHES,
  INITIAL_REGISTRATIONS,
  INITIAL_SPONSORS,
  INITIAL_TOURNAMENT_CONFIG,
} from '../src/data/mockData';
import {
  CategoryDetail,
  MatchItem,
  RegistrationItem,
  SponsorItem,
  TournamentConfig,
  AdminUser,
  CommitteeContact,
  CommitteeBankAccount,
  DownloadableDoc,
} from '../src/types';

// In-Memory Storage Fallback (used when MySQL host is not configured or in preview mode)
class MemoryStore {
  config: TournamentConfig = { ...INITIAL_TOURNAMENT_CONFIG };
  categories: CategoryDetail[] = [...INITIAL_CATEGORIES];
  registrations: RegistrationItem[] = [...INITIAL_REGISTRATIONS];
  matches: MatchItem[] = [...INITIAL_MATCHES];
  sponsors: SponsorItem[] = [...INITIAL_SPONSORS];
  adminUsers: AdminUser[] = [...INITIAL_ADMIN_USERS];
}

const memStore = new MemoryStore();

let pool: mysql.Pool | null = null;
let isMySqlConnected = false;
let mySqlError: string | null = null;

export function getMySqlStatus() {
  const host = process.env.MYSQL_HOST || (process.env.DATABASE_URL ? 'Via DATABASE_URL' : 'Not configured (In-Memory fallback)');
  const dbName = process.env.MYSQL_DATABASE || 'wabupcup_db';
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
    const rejectUnauthorized =
      process.env.MYSQL_SSL_REJECT_UNAUTHORIZED === 'false' ? false : true;
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
  const dbUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.trim() : undefined;
  const host = process.env.MYSQL_HOST ? process.env.MYSQL_HOST.trim() : undefined;
  if (!dbUrl && !host) {
    return false;
  }

  if (!dbInitPromise) {
    dbInitPromise = initDatabaseConnection().finally(() => {
      dbInitPromise = null;
    });
  }
  return dbInitPromise;
}

export async function initDatabaseConnection(customConfig?: CustomDbConfig): Promise<boolean> {
  // If customConfig provided, apply to process.env and memory
  if (customConfig) {
    if (customConfig.databaseUrl !== undefined) {
      process.env.DATABASE_URL = customConfig.databaseUrl.trim();
    }
    if (customConfig.host !== undefined) {
      process.env.MYSQL_HOST = customConfig.host.trim();
    }
    if (customConfig.port !== undefined) {
      process.env.MYSQL_PORT = String(customConfig.port);
    }
    if (customConfig.user !== undefined) {
      process.env.MYSQL_USER = customConfig.user.trim();
    }
    if (customConfig.password !== undefined) {
      process.env.MYSQL_PASSWORD = customConfig.password;
    }
    if (customConfig.database !== undefined) {
      process.env.MYSQL_DATABASE = customConfig.database.trim();
    }
    if (customConfig.ssl !== undefined) {
      process.env.MYSQL_SSL = customConfig.ssl ? 'true' : 'false';
    }
  }

  const dbUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.trim() : undefined;
  const host = process.env.MYSQL_HOST ? process.env.MYSQL_HOST.trim() : undefined;
  const user = process.env.MYSQL_USER ? process.env.MYSQL_USER.trim() : undefined;
  const password = process.env.MYSQL_PASSWORD !== undefined ? process.env.MYSQL_PASSWORD : undefined;
  const database = (process.env.MYSQL_DATABASE || 'wabupcup_db').trim();
  const isTidb = Boolean((dbUrl && dbUrl.includes('tidbcloud.com')) || (host && host.includes('tidbcloud.com')));
  const defaultPort = isTidb ? 4000 : 3306;
  const port = parseInt(process.env.MYSQL_PORT || String(defaultPort), 10);
  const useSsl = process.env.MYSQL_SSL === 'true' || process.env.MYSQL_SSL === '1' || isTidb;

  if (!dbUrl && !host) {
    console.log('[Database] No MySQL host or DATABASE_URL provided. Operating with in-memory persistence layer.');
    isMySqlConnected = false;
    return false;
  }

  try {
    let poolOptions: mysql.PoolOptions;

    if (dbUrl) {
      const ssl = resolveSslConfig(dbUrl, useSsl || isTidb);
      try {
        // Parse DATABASE_URL for fine-tuned PoolOptions with guaranteed SSL handling
        const parsedUrl = new URL(dbUrl);
        const urlDbName = parsedUrl.pathname.replace(/^\//, '') || database;
        const urlPort = parsedUrl.port ? parseInt(parsedUrl.port, 10) : (isTidb ? 4000 : 3306);
        poolOptions = {
          host: parsedUrl.hostname,
          port: urlPort,
          user: decodeURIComponent(parsedUrl.username),
          password: decodeURIComponent(parsedUrl.password),
          database: urlDbName,
          waitForConnections: true,
          connectionLimit: 5,
          connectTimeout: 8000,
          queueLimit: 0,
          ssl: ssl || (isTidb ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : (parsedUrl.searchParams.has('ssl') ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined)),
        };
      } catch {
        // If not a standard URL object, pass uri with ssl option
        poolOptions = {
          uri: dbUrl,
          waitForConnections: true,
          connectionLimit: 5,
          connectTimeout: 8000,
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
        connectionLimit: 5,
        connectTimeout: 8000,
        queueLimit: 0,
        ssl: ssl || (isTidb ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined),
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
          const tempOptions = { ...poolOptions, database: isTidb ? 'test' : undefined };
          const tempConn = await mysql.createConnection(tempOptions as any);
          (tempConn as any).on?.('error', (err: any) => console.warn('[MySQL Temp Connection Event]', err?.message));
          await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
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

    // Auto-check and setup tables if needed
    await autoMigrateTables();
    return true;
  } catch (err: any) {
    isMySqlConnected = false;
    mySqlError = err?.message || 'Failed to connect to MySQL';
    console.warn(`[MySQL Warning] Could not connect to MySQL: ${mySqlError}. Using fallback storage.`);
    return false;
  }
}

async function autoMigrateTables() {
  if (!pool || !isMySqlConnected) return;

  try {
    const [rows]: any = await pool.query("SHOW TABLES LIKE 'categories'");
    if (rows.length === 0) {
      console.log('[MySQL] Tables not found. Initializing schema automatically...');
      await runFullSchemaInit();
    }
  } catch (err) {
    console.error('[MySQL] Error checking tables:', err);
  }
}

export async function runFullSchemaInit() {
  if (!pool || !isMySqlConnected) {
    return { success: true, message: 'In-memory data reloaded successfully' };
  }

  const queries = [
    `CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(32) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      badge_title VARCHAR(100) NULL,
      age_restriction VARCHAR(100) NOT NULL,
      max_teams INT NOT NULL DEFAULT 16,
      registered_teams_count INT NOT NULL DEFAULT 0,
      registration_fee DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      total_prize DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      description TEXT NULL,
      prizes_json JSON NULL,
      rules_json JSON NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS registrations (
      id VARCHAR(64) PRIMARY KEY,
      reg_code VARCHAR(32) NOT NULL UNIQUE,
      category_id VARCHAR(32) NOT NULL,
      team_name VARCHAR(150) NOT NULL,
      team_logo LONGTEXT NULL,
      institution_name VARCHAR(200) NOT NULL,
      coach_name VARCHAR(150) NOT NULL,
      coach_phone VARCHAR(50) NOT NULL,
      coach_email VARCHAR(150) NULL,
      player_count INT NOT NULL DEFAULT 18,
      official_count INT NOT NULL DEFAULT 3,
      registration_date VARCHAR(50) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'PENDING_PAYMENT',
      payment_status VARCHAR(32) NOT NULL DEFAULT 'UNPAID',
      payment_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
      rejection_reason TEXT NULL,
      admin_notes TEXT NULL,
      documents_json JSON NULL,
      last_updated VARCHAR(50) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS matches (
      id VARCHAR(64) PRIMARY KEY,
      match_number INT NOT NULL,
      category_id VARCHAR(32) NOT NULL,
      round_name VARCHAR(100) NOT NULL,
      round_index INT NOT NULL DEFAULT 1,
      group_name VARCHAR(50) NULL,
      team_a_name VARCHAR(150) NOT NULL,
      team_a_institution VARCHAR(200) NULL,
      team_a_logo LONGTEXT NULL,
      team_a_score INT NULL,
      team_a_penalties INT NULL,
      team_b_name VARCHAR(150) NOT NULL,
      team_b_institution VARCHAR(200) NULL,
      team_b_logo LONGTEXT NULL,
      team_b_score INT NULL,
      team_b_penalties INT NULL,
      match_date VARCHAR(20) NOT NULL,
      match_time VARCHAR(20) NOT NULL,
      pitch VARCHAR(100) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING',
      live_minute VARCHAR(20) NULL,
      events_json JSON NULL,
      winner_id VARCHAR(10) NULL,
      next_match_id VARCHAR(64) NULL,
      next_match_slot VARCHAR(10) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS sponsors (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      tier VARCHAR(50) NOT NULL DEFAULT 'GOLD',
      logo_text VARCHAR(100) NOT NULL,
      logo_url LONGTEXT NULL,
      website_url VARCHAR(255) NULL,
      description TEXT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS admin_users (
      id VARCHAR(64) PRIMARY KEY,
      username VARCHAR(64) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(150) NOT NULL,
      role VARCHAR(32) NOT NULL DEFAULT 'PANITIA',
      email VARCHAR(150) NULL,
      phone VARCHAR(50) NULL,
      avatar_color VARCHAR(30) NOT NULL DEFAULT 'bg-red-600',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    `CREATE TABLE IF NOT EXISTS tournament_config (
      config_key VARCHAR(64) PRIMARY KEY,
      config_value LONGTEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  ];

  for (const q of queries) {
    await pool.query(q);
  }

  // Seed default categories if empty
  const [catRows]: any = await pool.query('SELECT COUNT(*) as count FROM categories');
  if (catRows[0].count === 0) {
    for (const cat of INITIAL_CATEGORIES) {
      await pool.query(
        `INSERT INTO categories (id, name, badge_title, age_restriction, max_teams, registered_teams_count, registration_fee, total_prize, description, prizes_json, rules_json) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cat.id,
          cat.name,
          cat.badgeTitle || '',
          cat.ageRestriction,
          cat.maxTeams,
          cat.registeredTeamsCount,
          cat.registrationFee,
          cat.totalPrize,
          cat.description || '',
          JSON.stringify(cat.prizes),
          JSON.stringify(cat.rules),
        ]
      );
    }
  }

  // Seed default admin users if empty
  const [admRows]: any = await pool.query('SELECT COUNT(*) as count FROM admin_users');
  if (admRows[0].count === 0) {
    for (const adm of INITIAL_ADMIN_USERS) {
      await pool.query(
        `INSERT INTO admin_users (id, username, password_hash, full_name, role, email, phone, avatar_color)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          adm.id,
          adm.username,
          adm.password || 'admin123',
          adm.fullName,
          adm.role,
          adm.email || '',
          adm.phone || '',
          adm.avatarColor || 'bg-red-600',
        ]
      );
    }
  }

  return { success: true, message: 'MySQL Database Tables Initialized and Seeded Successfully' };
}

// ----------------------------------------------------
// DATABASE SERVICE METHODS (WITH AUTOMATIC HYBRID RESOLVER)
// ----------------------------------------------------

export const Database = {
  // Config
  async getConfig(): Promise<TournamentConfig> {
    await ensureDbConnected();
    if (pool && isMySqlConnected) {
      try {
        const [rows]: any = await pool.query('SELECT config_value FROM tournament_config WHERE config_key = ?', ['main_config']);
        if (rows.length > 0) {
          return JSON.parse(rows[0].config_value);
        }
      } catch (err) {
        console.error('Error fetching config from MySQL:', err);
      }
    }
    return memStore.config;
  },

  async updateConfig(newConfig: Partial<TournamentConfig>): Promise<TournamentConfig> {
    await ensureDbConnected();
    const updated = { ...memStore.config, ...newConfig };
    memStore.config = updated;

    if (pool && isMySqlConnected) {
      try {
        await pool.query(
          `INSERT INTO tournament_config (config_key, config_value) VALUES (?, ?) 
           ON DUPLICATE KEY UPDATE config_value = ?`,
          ['main_config', JSON.stringify(updated), JSON.stringify(updated)]
        );
      } catch (err) {
        console.error('Error saving config to MySQL:', err);
      }
    }
    return updated;
  },

  // Categories
  async getCategories(): Promise<CategoryDetail[]> {
    await ensureDbConnected();
    if (pool && isMySqlConnected) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM categories ORDER BY sort_order ASC, id ASC');
        if (rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            name: r.name,
            badgeTitle: r.badge_title,
            ageRestriction: r.age_restriction,
            maxTeams: r.max_teams,
            registeredTeamsCount: r.registered_teams_count,
            registrationFee: Number(r.registration_fee),
            totalPrize: Number(r.total_prize),
            description: r.description,
            prizes: typeof r.prizes_json === 'string' ? JSON.parse(r.prizes_json) : (r.prizes_json || []),
            rules: typeof r.rules_json === 'string' ? JSON.parse(r.rules_json) : (r.rules_json || []),
          }));
        }
      } catch (err) {
        console.error('Error getting categories from MySQL:', err);
      }
    }
    return memStore.categories;
  },

  async saveCategory(cat: CategoryDetail): Promise<CategoryDetail> {
    await ensureDbConnected();
    const idx = memStore.categories.findIndex(c => c.id === cat.id);
    if (idx >= 0) {
      memStore.categories[idx] = cat;
    } else {
      memStore.categories.push(cat);
    }

    if (pool && isMySqlConnected) {
      try {
        await pool.query(
          `INSERT INTO categories (id, name, badge_title, age_restriction, max_teams, registered_teams_count, registration_fee, total_prize, description, prizes_json, rules_json)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name=?, badge_title=?, age_restriction=?, max_teams=?, registered_teams_count=?, registration_fee=?, total_prize=?, description=?, prizes_json=?, rules_json=?`,
          [
            cat.id, cat.name, cat.badgeTitle || '', cat.ageRestriction, cat.maxTeams, cat.registeredTeamsCount, cat.registrationFee, cat.totalPrize, cat.description || '', JSON.stringify(cat.prizes), JSON.stringify(cat.rules),
            cat.name, cat.badgeTitle || '', cat.ageRestriction, cat.maxTeams, cat.registeredTeamsCount, cat.registrationFee, cat.totalPrize, cat.description || '', JSON.stringify(cat.prizes), JSON.stringify(cat.rules),
          ]
        );
      } catch (err) {
        console.error('Error saving category to MySQL:', err);
      }
    }
    return cat;
  },

  async deleteCategory(categoryId: string): Promise<boolean> {
    await ensureDbConnected();
    memStore.categories = memStore.categories.filter(c => c.id !== categoryId);
    if (pool && isMySqlConnected) {
      try {
        await pool.query('DELETE FROM categories WHERE id = ?', [categoryId]);
      } catch (err) {
        console.error('Error deleting category from MySQL:', err);
      }
    }
    return true;
  },

  // Registrations
  async getRegistrations(): Promise<RegistrationItem[]> {
    await ensureDbConnected();
    if (pool && isMySqlConnected) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM registrations ORDER BY created_at DESC');
        if (rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            regCode: r.reg_code,
            category: r.category_id,
            teamName: r.team_name,
            teamLogo: r.team_logo || undefined,
            institutionName: r.institution_name,
            coachName: r.coach_name,
            coachPhone: r.coach_phone,
            coachEmail: r.coach_email || '',
            playerCount: r.player_count,
            officialCount: r.official_count,
            registrationDate: r.registration_date,
            status: r.status,
            paymentStatus: r.payment_status,
            paymentAmount: Number(r.payment_amount),
            rejectionReason: r.rejection_reason || undefined,
            adminNotes: r.admin_notes || undefined,
            documents: typeof r.documents_json === 'string' ? JSON.parse(r.documents_json) : (r.documents_json || {}),
            lastUpdated: r.last_updated || r.registration_date,
          }));
        }
      } catch (err) {
        console.error('Error fetching registrations from MySQL:', err);
      }
    }
    return memStore.registrations;
  },

  async saveRegistration(item: RegistrationItem): Promise<RegistrationItem> {
    await ensureDbConnected();
    const idx = memStore.registrations.findIndex(r => r.id === item.id);
    if (idx >= 0) {
      memStore.registrations[idx] = item;
    } else {
      memStore.registrations.unshift(item);
    }

    if (pool && isMySqlConnected) {
      try {
        await pool.query(
          `INSERT INTO registrations (id, reg_code, category_id, team_name, team_logo, institution_name, coach_name, coach_phone, coach_email, player_count, official_count, registration_date, status, payment_status, payment_amount, rejection_reason, admin_notes, documents_json, last_updated)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE reg_code=?, category_id=?, team_name=?, team_logo=?, institution_name=?, coach_name=?, coach_phone=?, coach_email=?, player_count=?, official_count=?, status=?, payment_status=?, payment_amount=?, rejection_reason=?, admin_notes=?, documents_json=?, last_updated=?`,
          [
            item.id, item.regCode, item.category, item.teamName, item.teamLogo || null, item.institutionName, item.coachName, item.coachPhone, item.coachEmail || '', item.playerCount, item.officialCount, item.registrationDate, item.status, item.paymentStatus, item.paymentAmount, item.rejectionReason || null, item.adminNotes || null, JSON.stringify(item.documents || {}), item.lastUpdated,
            item.regCode, item.category, item.teamName, item.teamLogo || null, item.institutionName, item.coachName, item.coachPhone, item.coachEmail || '', item.playerCount, item.officialCount, item.status, item.paymentStatus, item.paymentAmount, item.rejectionReason || null, item.adminNotes || null, JSON.stringify(item.documents || {}), item.lastUpdated,
          ]
        );
      } catch (err) {
        console.error('Error saving registration to MySQL:', err);
      }
    }
    return item;
  },

  async deleteRegistration(id: string): Promise<boolean> {
    await ensureDbConnected();
    memStore.registrations = memStore.registrations.filter(r => r.id !== id);
    if (pool && isMySqlConnected) {
      try {
        await pool.query('DELETE FROM registrations WHERE id = ?', [id]);
      } catch (err) {
        console.error('Error deleting registration from MySQL:', err);
      }
    }
    return true;
  },

  // Matches
  async getMatches(): Promise<MatchItem[]> {
    await ensureDbConnected();
    if (pool && isMySqlConnected) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM matches ORDER BY match_date ASC, match_time ASC, match_number ASC');
        if (rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            matchNumber: r.match_number,
            category: r.category_id,
            round: r.round_name,
            roundIndex: r.round_index,
            group: r.group_name || undefined,
            teamA: {
              name: r.team_a_name,
              institution: r.team_a_institution || undefined,
              logo: r.team_a_logo || undefined,
              score: r.team_a_score !== null ? Number(r.team_a_score) : undefined,
              penalties: r.team_a_penalties !== null ? Number(r.team_a_penalties) : undefined,
            },
            teamB: {
              name: r.team_b_name,
              institution: r.team_b_institution || undefined,
              logo: r.team_b_logo || undefined,
              score: r.team_b_score !== null ? Number(r.team_b_score) : undefined,
              penalties: r.team_b_penalties !== null ? Number(r.team_b_penalties) : undefined,
            },
            date: r.match_date,
            time: r.match_time,
            pitch: r.pitch,
            status: r.status,
            liveMinute: r.live_minute || undefined,
            events: typeof r.events_json === 'string' ? JSON.parse(r.events_json) : (r.events_json || []),
            winnerId: r.winner_id || undefined,
            nextMatchId: r.next_match_id || undefined,
            nextMatchSlot: r.next_match_slot || undefined,
          }));
        }
      } catch (err) {
        console.error('Error fetching matches from MySQL:', err);
      }
    }
    return memStore.matches;
  },

  async saveMatch(match: MatchItem): Promise<MatchItem> {
    await ensureDbConnected();
    const idx = memStore.matches.findIndex(m => m.id === match.id);
    if (idx >= 0) {
      memStore.matches[idx] = match;
    } else {
      memStore.matches.push(match);
    }

    if (pool && isMySqlConnected) {
      try {
        await pool.query(
          `INSERT INTO matches (id, match_number, category_id, round_name, round_index, group_name, team_a_name, team_a_institution, team_a_logo, team_a_score, team_a_penalties, team_b_name, team_b_institution, team_b_logo, team_b_score, team_b_penalties, match_date, match_time, pitch, status, live_minute, events_json, winner_id, next_match_id, next_match_slot)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE match_number=?, category_id=?, round_name=?, round_index=?, group_name=?, team_a_name=?, team_a_institution=?, team_a_logo=?, team_a_score=?, team_a_penalties=?, team_b_name=?, team_b_institution=?, team_b_logo=?, team_b_score=?, team_b_penalties=?, match_date=?, match_time=?, pitch=?, status=?, live_minute=?, events_json=?, winner_id=?, next_match_id=?, next_match_slot=?`,
          [
            match.id, match.matchNumber, match.category, match.round, match.roundIndex, match.group || null, match.teamA.name, match.teamA.institution || null, match.teamA.logo || null, match.teamA.score !== undefined ? match.teamA.score : null, match.teamA.penalties !== undefined ? match.teamA.penalties : null, match.teamB.name, match.teamB.institution || null, match.teamB.logo || null, match.teamB.score !== undefined ? match.teamB.score : null, match.teamB.penalties !== undefined ? match.teamB.penalties : null, match.date, match.time, match.pitch, match.status, match.liveMinute || null, JSON.stringify(match.events || []), match.winnerId || null, match.nextMatchId || null, match.nextMatchSlot || null,
            match.matchNumber, match.category, match.round, match.roundIndex, match.group || null, match.teamA.name, match.teamA.institution || null, match.teamA.logo || null, match.teamA.score !== undefined ? match.teamA.score : null, match.teamA.penalties !== undefined ? match.teamA.penalties : null, match.teamB.name, match.teamB.institution || null, match.teamB.logo || null, match.teamB.score !== undefined ? match.teamB.score : null, match.teamB.penalties !== undefined ? match.teamB.penalties : null, match.date, match.time, match.pitch, match.status, match.liveMinute || null, JSON.stringify(match.events || []), match.winnerId || null, match.nextMatchId || null, match.nextMatchSlot || null,
          ]
        );
      } catch (err) {
        console.error('Error saving match to MySQL:', err);
      }
    }
    return match;
  },

  async deleteMatch(matchId: string): Promise<boolean> {
    await ensureDbConnected();
    memStore.matches = memStore.matches.filter(m => m.id !== matchId);
    if (pool && isMySqlConnected) {
      try {
        await pool.query('DELETE FROM matches WHERE id = ?', [matchId]);
      } catch (err) {
        console.error('Error deleting match from MySQL:', err);
      }
    }
    return true;
  },

  // Sponsors
  async getSponsors(): Promise<SponsorItem[]> {
    await ensureDbConnected();
    if (pool && isMySqlConnected) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM sponsors WHERE is_active = TRUE ORDER BY sort_order ASC');
        if (rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            name: r.name,
            tier: r.tier,
            logoText: r.logo_text,
            logoUrl: r.logo_url || undefined,
            websiteUrl: r.website_url || undefined,
            description: r.description || undefined,
          }));
        }
      } catch (err) {
        console.error('Error fetching sponsors from MySQL:', err);
      }
    }
    return memStore.sponsors;
  },

  async saveSponsor(sponsor: SponsorItem): Promise<SponsorItem> {
    await ensureDbConnected();
    const idx = memStore.sponsors.findIndex(s => s.id === sponsor.id);
    if (idx >= 0) {
      memStore.sponsors[idx] = sponsor;
    } else {
      memStore.sponsors.push(sponsor);
    }

    if (pool && isMySqlConnected) {
      try {
        await pool.query(
          `INSERT INTO sponsors (id, name, tier, logo_text, logo_url, website_url, description)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name=?, tier=?, logo_text=?, logo_url=?, website_url=?, description=?`,
          [
            sponsor.id, sponsor.name, sponsor.tier, sponsor.logoText, sponsor.logoUrl || null, sponsor.websiteUrl || null, sponsor.description || null,
            sponsor.name, sponsor.tier, sponsor.logoText, sponsor.logoUrl || null, sponsor.websiteUrl || null, sponsor.description || null,
          ]
        );
      } catch (err) {
        console.error('Error saving sponsor to MySQL:', err);
      }
    }
    return sponsor;
  },

  async deleteSponsor(id: string): Promise<boolean> {
    await ensureDbConnected();
    memStore.sponsors = memStore.sponsors.filter(s => s.id !== id);
    if (pool && isMySqlConnected) {
      try {
        await pool.query('DELETE FROM sponsors WHERE id = ?', [id]);
      } catch (err) {
        console.error('Error deleting sponsor from MySQL:', err);
      }
    }
    return true;
  },

  // Admin Users
  async getAdmins(): Promise<AdminUser[]> {
    await ensureDbConnected();
    if (pool && isMySqlConnected) {
      try {
        const [rows]: any = await pool.query('SELECT id, username, full_name, role, email, phone, avatar_color, created_at FROM admin_users');
        if (rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            username: r.username,
            fullName: r.full_name,
            role: r.role,
            email: r.email || '',
            phone: r.phone || '',
            avatarColor: r.avatar_color,
            createdAt: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : '2026-08-01',
          }));
        }
      } catch (err) {
        console.error('Error fetching admins from MySQL:', err);
      }
    }
    return memStore.adminUsers;
  },

  async saveAdmin(admin: AdminUser, password?: string): Promise<AdminUser> {
    await ensureDbConnected();
    const idx = memStore.adminUsers.findIndex(a => a.id === admin.id || a.username.toLowerCase() === admin.username.toLowerCase());
    if (idx >= 0) {
      memStore.adminUsers[idx] = { ...memStore.adminUsers[idx], ...admin };
    } else {
      memStore.adminUsers.push(admin);
    }

    if (pool && isMySqlConnected) {
      try {
        const passHash = password || admin.password || 'admin123';
        await pool.query(
          `INSERT INTO admin_users (id, username, password_hash, full_name, role, email, phone, avatar_color, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE full_name=?, role=?, email=?, phone=?, avatar_color=?, password_hash=COALESCE(?, password_hash)`,
          [
            admin.id,
            admin.username,
            passHash,
            admin.fullName,
            admin.role,
            admin.email || null,
            admin.phone || null,
            admin.avatarColor || 'bg-red-600',
            admin.createdAt ? new Date(admin.createdAt) : new Date(),
            // Updates
            admin.fullName,
            admin.role,
            admin.email || null,
            admin.phone || null,
            admin.avatarColor || 'bg-red-600',
            password || null,
          ]
        );
      } catch (err) {
        console.error('Error saving admin user to MySQL:', err);
      }
    }
    return admin;
  },

  async deleteAdmin(id: string): Promise<boolean> {
    await ensureDbConnected();
    // Protect master superadmin from deletion
    const target = memStore.adminUsers.find(a => a.id === id);
    if (target && target.username.toLowerCase() === 'superadmin') {
      return false;
    }
    memStore.adminUsers = memStore.adminUsers.filter(a => a.id !== id);
    if (pool && isMySqlConnected) {
      try {
        await pool.query("DELETE FROM admin_users WHERE id = ? AND username != 'superadmin'", [id]);
      } catch (err) {
        console.error('Error deleting admin from MySQL:', err);
      }
    }
    return true;
  },

  // Generate complete SQL Export dump
  async exportFullSqlDump(): Promise<string> {
    await ensureDbConnected();
    const categories = await this.getCategories();
    const registrations = await this.getRegistrations();
    const matches = await this.getMatches();
    const sponsors = await this.getSponsors();
    const admins = await this.getAdmins();
    const config = await this.getConfig();

    const timestamp = new Date().toISOString();

    let sql = `-- ==========================================================\n`;
    sql += `-- WABUP CUP 2026 COMPLETE DATABASE BACKUP & EXPORT\n`;
    sql += `-- Generated at: ${timestamp}\n`;
    sql += `-- Target: MySQL 5.7+ / 8.0+ / MariaDB / Cloud SQL / phpMyAdmin\n`;
    sql += `-- ==========================================================\n\n`;

    sql += `CREATE DATABASE IF NOT EXISTS \`wabupcup_db\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
    sql += `USE \`wabupcup_db\`;\n\n`;

    sql += `-- 1. CONFIG\n`;
    sql += `INSERT INTO \`tournament_config\` (\`config_key\`, \`config_value\`) VALUES ('main_config', '${JSON.stringify(config).replace(/'/g, "\\'")}') ON DUPLICATE KEY UPDATE \`config_value\`=VALUES(\`config_value\`);\n\n`;

    sql += `-- 2. CATEGORIES\n`;
    for (const c of categories) {
      sql += `INSERT INTO \`categories\` (\`id\`, \`name\`, \`badge_title\`, \`age_restriction\`, \`max_teams\`, \`registered_teams_count\`, \`registration_fee\`, \`total_prize\`, \`description\`, \`prizes_json\`, \`rules_json\`) VALUES ('${c.id}', '${c.name.replace(/'/g, "\\'")}', '${(c.badgeTitle || '').replace(/'/g, "\\'")}', '${c.ageRestriction}', ${c.maxTeams}, ${c.registeredTeamsCount}, ${c.registrationFee}, ${c.totalPrize}, '${(c.description || '').replace(/'/g, "\\'")}', '${JSON.stringify(c.prizes).replace(/'/g, "\\'")}', '${JSON.stringify(c.rules).replace(/'/g, "\\'")}') ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);\n`;
    }
    sql += `\n`;

    sql += `-- 3. REGISTRATIONS\n`;
    for (const r of registrations) {
      sql += `INSERT INTO \`registrations\` (\`id\`, \`reg_code\`, \`category_id\`, \`team_name\`, \`institution_name\`, \`coach_name\`, \`coach_phone\`, \`coach_email\`, \`player_count\`, \`official_count\`, \`registration_date\`, \`status\`, \`payment_status\`, \`payment_amount\`, \`documents_json\`, \`last_updated\`) VALUES ('${r.id}', '${r.regCode}', '${r.category}', '${r.teamName.replace(/'/g, "\\'")}', '${r.institutionName.replace(/'/g, "\\'")}', '${r.coachName.replace(/'/g, "\\'")}', '${r.coachPhone}', '${r.coachEmail}', ${r.playerCount}, ${r.officialCount}, '${r.registrationDate}', '${r.status}', '${r.paymentStatus}', ${r.paymentAmount}, '${JSON.stringify(r.documents || {}).replace(/'/g, "\\'")}', '${r.lastUpdated}') ON DUPLICATE KEY UPDATE \`team_name\`=VALUES(\`team_name\`);\n`;
    }
    sql += `\n`;

    sql += `-- 4. MATCHES\n`;
    for (const m of matches) {
      sql += `INSERT INTO \`matches\` (\`id\`, \`match_number\`, \`category_id\`, \`round_name\`, \`round_index\`, \`team_a_name\`, \`team_a_institution\`, \`team_a_score\`, \`team_b_name\`, \`team_b_institution\`, \`team_b_score\`, \`match_date\`, \`match_time\`, \`pitch\`, \`status\`, \`live_minute\`, \`events_json\`, \`winner_id\`) VALUES ('${m.id}', ${m.matchNumber}, '${m.category}', '${m.round.replace(/'/g, "\\'")}', ${m.roundIndex}, '${m.teamA.name.replace(/'/g, "\\'")}', '${(m.teamA.institution || '').replace(/'/g, "\\'")}', ${m.teamA.score !== undefined ? m.teamA.score : 'NULL'}, '${m.teamB.name.replace(/'/g, "\\'")}', '${(m.teamB.institution || '').replace(/'/g, "\\'")}', ${m.teamB.score !== undefined ? m.teamB.score : 'NULL'}, '${m.date}', '${m.time}', '${m.pitch.replace(/'/g, "\\'")}', '${m.status}', ${m.liveMinute ? `'${m.liveMinute}'` : 'NULL'}, '${JSON.stringify(m.events || []).replace(/'/g, "\\'")}', ${m.winnerId ? `'${m.winnerId}'` : 'NULL'}) ON DUPLICATE KEY UPDATE \`team_a_name\`=VALUES(\`team_a_name\`);\n`;
    }
    sql += `\n`;

    sql += `-- 5. SPONSORS\n`;
    for (const s of sponsors) {
      sql += `INSERT INTO \`sponsors\` (\`id\`, \`name\`, \`tier\`, \`logo_text\`, \`website_url\`, \`description\`) VALUES ('${s.id}', '${s.name.replace(/'/g, "\\'")}', '${s.tier}', '${s.logoText}', '${s.websiteUrl || ''}', '${(s.description || '').replace(/'/g, "\\'")}') ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);\n`;
    }
    sql += `\n`;

    sql += `-- 6. ADMIN USERS\n`;
    for (const a of admins) {
      sql += `INSERT INTO \`admin_users\` (\`id\`, \`username\`, \`password_hash\`, \`full_name\`, \`role\`, \`email\`, \`phone\`, \`avatar_color\`) VALUES ('${a.id}', '${a.username}', 'admin123', '${a.fullName.replace(/'/g, "\\'")}', '${a.role}', '${a.email}', '${a.phone}', '${a.avatarColor}') ON DUPLICATE KEY UPDATE \`full_name\`=VALUES(\`full_name\`);\n`;
    }

    return sql;
  },
};
