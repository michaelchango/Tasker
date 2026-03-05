import { getDb, saveDb } from '../db.js';

const Task = {
  getAllByProject(projectId) {
    const db = getDb();
    if (!db) return [];
    const stmt = db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC');
    stmt.bind([projectId]);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  getById(id) {
    const db = getDb();
    if (!db) return null;
    const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
    stmt.bind([id]);
    let result = null;
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    return result;
  },

  create(projectId, task) {
    const db = getDb();
    if (!db) return null;
    
    const stmt = db.prepare(`
      INSERT INTO tasks (project_id, name, description, priority, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      projectId,
      task.name,
      task.description || '',
      task.priority || 'medium',
      task.due_date || null,
      task.status || 'todo'
    ]);
    stmt.free();
    saveDb();
    
    const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
    return this.getById(lastId);
  },

  update(id, task) {
    const db = getDb();
    if (!db) return null;
    
    const stmt = db.prepare(`
      UPDATE tasks 
      SET name = ?, description = ?, priority = ?, due_date = ?, status = ?
      WHERE id = ?
    `);
    stmt.run([
      task.name,
      task.description || '',
      task.priority || 'medium',
      task.due_date || null,
      task.status || 'todo',
      id
    ]);
    stmt.free();
    saveDb();
    return this.getById(id);
  },

  delete(id) {
    const db = getDb();
    if (!db) return null;
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    stmt.run([id]);
    stmt.free();
    saveDb();
    return { success: true };
  }
};

export default Task;
