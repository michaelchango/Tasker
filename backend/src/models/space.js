import { getDb } from '../db.js';

const Space = {
  async getAllByUser(userId) {
    const db = getDb();
    if (!db) return [];
    return await db.all(
      'SELECT * FROM spaces WHERE user_id = $1 ORDER BY sort_order ASC, created_at DESC',
      [userId]
    );
  },

  async getById(id) {
    const db = getDb();
    if (!db) return null;
    return await db.get('SELECT * FROM spaces WHERE id = $1', [id]);
  },

  async create(userId, name) {
    const db = getDb();
    if (!db) return null;
    
    const result = await db.get(
      'INSERT INTO spaces (user_id, name) VALUES ($1, $2) RETURNING *',
      [userId, name]
    );
    return result;
  },

  async update(id, name) {
    const db = getDb();
    if (!db) return null;
    
    await db.exec(
      'UPDATE spaces SET name = $1 WHERE id = $2',
      [name, id]
    );
    return await this.getById(id);
  },

  async delete(id) {
    const db = getDb();
    if (!db) return null;
    
    // Delete all tasks in projects within this space
    await db.exec(`DELETE FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE space_id = $1)`, [id]);
    // Delete all projects within this space
    await db.exec('DELETE FROM projects WHERE space_id = $1', [id]);
    // Delete the space
    await db.exec('DELETE FROM spaces WHERE id = $1', [id]);
    return { success: true };
  },

  async updateSortOrder(spaceOrders) {
    const db = getDb();
    if (!db) return null;
    
    for (const { id, sort_order } of spaceOrders) {
      await db.exec(
        'UPDATE spaces SET sort_order = $1 WHERE id = $2',
        [sort_order, id]
      );
    }
    return { success: true };
  }
};

export default Space;
