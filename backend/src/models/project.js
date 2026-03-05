import { getDb, saveDb } from '../db.js';

const Project = {
  getAllBySpace(spaceId) {
    const db = getDb();
    if (!db) return [];
    const stmt = db.prepare('SELECT * FROM projects WHERE space_id = ? ORDER BY sort_order ASC, created_at DESC');
    stmt.bind([spaceId]);
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
    const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
    stmt.bind([id]);
    let result = null;
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    return result;
  },

  create(spaceId, project) {
    const db = getDb();
    if (!db) return null;
    
    const stmt = db.prepare(`
      INSERT INTO projects (space_id, name, type, description, status, start_date, end_date, remarks, dev, test, ops, release_date, docs_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run([
      spaceId,
      project.name,
      project.type || 'general',
      project.description || '',
      project.status || 'planning',
      project.start_date || null,
      project.end_date || null,
      project.remarks || '',
      project.dev || '',
      project.test || '',
      project.ops || '',
      project.release_date || null,
      project.docs_url || ''
    ]);
    stmt.free();
    saveDb();
    
    const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
    return this.getById(lastId);
  },

  update(id, project) {
    const db = getDb();
    if (!db) return null;
    
    const stmt = db.prepare(`
      UPDATE projects 
      SET name = ?, type = ?, description = ?, status = ?, start_date = ?, end_date = ?, 
          remarks = ?, dev = ?, test = ?, ops = ?, release_date = ?, docs_url = ?
      WHERE id = ?
    `);
    stmt.run([
      project.name,
      project.type || 'general',
      project.description || '',
      project.status || 'planning',
      project.start_date || null,
      project.end_date || null,
      project.remarks || '',
      project.dev || '',
      project.test || '',
      project.ops || '',
      project.release_date || null,
      project.docs_url || '',
      id
    ]);
    stmt.free();
    saveDb();
    return this.getById(id);
  },

  delete(id) {
    const db = getDb();
    if (!db) return null;
    
    // Delete all tasks in this project
    db.run('DELETE FROM tasks WHERE project_id = ?', [id]);
    // Delete the project
    const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
    stmt.run([id]);
    stmt.free();
    saveDb();
    return { success: true };
  },

  updateSortOrder(projectOrders) {
    const db = getDb();
    if (!db) return null;
    
    for (const { id, sort_order } of projectOrders) {
      const stmt = db.prepare('UPDATE projects SET sort_order = ? WHERE id = ?');
      stmt.run([sort_order, id]);
      stmt.free();
    }
    saveDb();
    return { success: true };
  }
};

export default Project;
