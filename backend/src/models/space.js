import { getDb, saveDb } from '../db.js';

const Space = {
  getAllByUser(userId) {
    const db = getDb();
    if (!db) return [];
    const stmt = db.prepare('SELECT * FROM spaces WHERE user_id = ? ORDER BY sort_order ASC, created_at DESC');
    stmt.bind([userId]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    console.log('Loaded spaces from DB:', results);
    return results;
  },

  getById(id) {
    const db = getDb();
    if (!db) return null;
    const stmt = db.prepare('SELECT * FROM spaces WHERE id = ?');
    stmt.bind([id]);
    let result = null;
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    return result;
  },

  create(userId, name) {
    const db = getDb();
    if (!db) return null;
    
    const stmt = db.prepare('INSERT INTO spaces (user_id, name) VALUES (?, ?)');
    stmt.run([userId, name]);
    stmt.free();
    saveDb();
    
    const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
    return this.getById(lastId);
  },

  update(id, name) {
    const db = getDb();
    if (!db) return null;
    
    const stmt = db.prepare('UPDATE spaces SET name = ? WHERE id = ?');
    stmt.run([name, id]);
    stmt.free();
    saveDb();
    return this.getById(id);
  },

  delete(id) {
    const db = getDb();
    if (!db) return null;
    
    // Delete all tasks in projects within this space
    db.run(`DELETE FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE space_id = ?)`);
    // Delete all projects within this space
    db.run('DELETE FROM projects WHERE space_id = ?', [id]);
    // Delete the space
    const stmt = db.prepare('DELETE FROM spaces WHERE id = ?');
    stmt.run([id]);
    stmt.free();
    saveDb();
    return { success: true };
  },

  updateSortOrder(spaceOrders) {
    const db = getDb();
    if (!db) return null;
    
    console.log('Updating sort order for spaces:', spaceOrders);
    
    // spaceOrders is an array of { id, sort_order }
    for (const { id, sort_order } of spaceOrders) {
      console.log(`Updating space ${id} to sort_order ${sort_order}`);
      const stmt = db.prepare('UPDATE spaces SET sort_order = ? WHERE id = ?');
      stmt.run([sort_order, id]);
      stmt.free();
    }
    saveDb();
    console.log('Sort order saved to database');
    return { success: true };
  }
};

export default Space;
