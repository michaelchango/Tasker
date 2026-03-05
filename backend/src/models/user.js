import { getDb } from '../db.js';
import crypto from 'crypto';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const User = {
  async getByUsername(username) {
    const db = getDb();
    if (!db) return null;
    return await db.get('SELECT * FROM users WHERE username = $1', [username]);
  },

  async getById(id) {
    const db = getDb();
    if (!db) return null;
    return await db.get('SELECT id, username, created_at FROM users WHERE id = $1', [id]);
  },

  async create(username, password) {
    const db = getDb();
    if (!db) return null;
    
    const hashedPassword = hashPassword(password);
    
    const result = await db.get(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, created_at',
      [username, hashedPassword]
    );
    
    return result;
  },

  async verify(username, password) {
    const user = await this.getByUsername(username);
    if (!user) return null;
    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) return null;
    return { id: user.id, username: user.username };
  }
};

export default User;
