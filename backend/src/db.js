import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 环境变量
const DATABASE_URL = process.env.DATABASE_URL;

// 根据环境选择数据库类型
const isProduction = !!DATABASE_URL;

// 原始数据库实例
let sqliteDb = null;
let pgPool = null;

// 数据库客户端 (统一接口)
let db = null;

async function initDb() {
  if (isProduction) {
    // 生产环境: 使用 PostgreSQL (Neon)
    await initPostgresDb();
  } else {
    // 本地开发: 使用 SQLite
    await initSqliteDb();
  }
  return db;
}

async function initSqliteDb() {
  const SQL = await initSqlJs();
  const dbPath = path.join(__dirname, '..', 'data', 'projectflow.db');
  
  // 确保目录存在
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    sqliteDb = new SQL.Database(buffer);
  } else {
    sqliteDb = new SQL.Database();
  }
  
  // 创建表
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS spaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      space_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      type TEXT DEFAULT 'general',
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'planning',
      start_date TEXT,
      end_date TEXT,
      remarks TEXT DEFAULT '',
      dev TEXT DEFAULT '',
      test TEXT DEFAULT '',
      ops TEXT DEFAULT '',
      release_date TEXT,
      docs_url TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE
    )
  `);
  
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      priority TEXT DEFAULT 'medium',
      due_date TEXT,
      status TEXT DEFAULT 'todo',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    )
  `);
  
  // 保存初始数据库
  saveDb();
  console.log('✅ SQLite database initialized');
  
  // 创建统一接口
  db = {
    // 执行查询并返回所有结果 (SELECT)
    all: (sql, params = []) => {
      const stmt = sqliteDb.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params);
      }
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    },
    
    // 执行查询并返回一行 (SELECT)
    get: (sql, params = []) => {
      const stmt = sqliteDb.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params);
      }
      let result = null;
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      stmt.free();
      return result;
    },
    
    // 执行插入并返回插入的ID
    run: (sql, params = []) => {
      const stmt = sqliteDb.prepare(sql);
      stmt.run(params);
      stmt.free();
      saveDb();
      const result = sqliteDb.exec('SELECT last_insert_rowid() as id');
      return result[0]?.values[0]?.[0];
    },
    
    // 执行更新/删除
    exec: (sql, params = []) => {
      const stmt = sqliteDb.prepare(sql);
      stmt.run(params);
      stmt.free();
      saveDb();
    }
  };
}

async function initPostgresDb() {
  const { Pool } = pg;
  pgPool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  // 测试连接
  const client = await pgPool.connect();
  try {
    // 创建表
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS spaces (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        space_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        type TEXT DEFAULT 'general',
        description TEXT DEFAULT '',
        status TEXT DEFAULT 'planning',
        start_date TEXT,
        end_date TEXT,
        remarks TEXT DEFAULT '',
        dev TEXT DEFAULT '',
        test TEXT DEFAULT '',
        ops TEXT DEFAULT '',
        release_date TEXT,
        docs_url TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE CASCADE
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        priority TEXT DEFAULT 'medium',
        due_date TEXT,
        status TEXT DEFAULT 'todo',
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);
    
    console.log('✅ PostgreSQL database initialized');
  } finally {
    client.release();
  }
  
  // 创建统一接口
  db = {
    // 执行查询并返回所有结果 (SELECT)
    all: async (sql, params = []) => {
      const result = await pgPool.query(sql, params);
      return result.rows;
    },
    
    // 执行查询并返回一行 (SELECT)
    get: async (sql, params = []) => {
      const result = await pgPool.query(sql, params);
      return result.rows[0] || null;
    },
    
    // 执行插入并返回插入的ID (使用 RETURNING)
    run: async (sql, params = []) => {
      const result = await pgPool.query(sql + ' RETURNING id', params);
      return result.rows[0]?.id;
    },
    
    // 执行更新/删除
    exec: async (sql, params = []) => {
      return pgPool.query(sql, params);
    }
  };
}

// SQLite 保存
function saveDb() {
  if (!isProduction && sqliteDb) {
    const data = sqliteDb.export();
    const buffer = Buffer.from(data);
    const dbPath = path.join(__dirname, '..', 'data', 'projectflow.db');
    fs.writeFileSync(dbPath, buffer);
  }
}

function getDb() {
  return db;
}

export { initDb, getDb, saveDb, isProduction };
export default { initDb, getDb, saveDb, isProduction };
