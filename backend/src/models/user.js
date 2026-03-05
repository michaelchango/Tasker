import { getDb, saveDb } from '../db.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'data', 'projectflow.db');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const User = {
  getByUsername(username) {
    const db = getDb();
    if (!db) return null;
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    stmt.bind([username]);
    let result = null;
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    return result;
  },

  getById(id) {
    const db = getDb();
    if (!db) return null;
    const stmt = db.prepare('SELECT id, username, created_at FROM users WHERE id = ?');
    stmt.bind([id]);
    let result = null;
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    return result;
  },

  create(username, password) {
    const db = getDb();
    if (!db) return null;
    
    const hashedPassword = hashPassword(password);
    
    // Use exec to insert and get the last row id
    db.exec(`INSERT INTO users (username, password) VALUES ('${username}', '${hashedPassword}')`);
    
    // Get the last inserted id
    const result = db.exec('SELECT last_insert_rowid() as id');
    if (!result.length || !result[0].values.length) {
      console.error('Failed to get last insert id');
      return null;
    }
    const lastId = result[0].values[0][0];
    
    // Fetch the created user
    const user = this.getById(lastId);
    if (!user) {
      console.error('Failed to fetch created user with id:', lastId);
      return null;
    }
    
    // Save after getting the user
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
    
    return user;
  },

  verify(username, password) {
    const user = this.getByUsername(username);
    if (!user) return null;
    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) return null;
    return { id: user.id, username: user.username };
  }
};

export default User;
