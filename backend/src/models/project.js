import { getDb } from '../db.js';

const Project = {
  async getAllBySpace(spaceId) {
    const db = getDb();
    if (!db) return [];
    return await db.all(
      'SELECT * FROM projects WHERE space_id = $1 ORDER BY sort_order ASC, created_at DESC',
      [spaceId]
    );
  },

  async getById(id) {
    const db = getDb();
    if (!db) return null;
    return await db.get('SELECT * FROM projects WHERE id = $1', [id]);
  },

  async create(spaceId, project) {
    const db = getDb();
    if (!db) return null;
    
    const result = await db.get(
      `INSERT INTO projects (space_id, name, type, description, status, start_date, end_date, remarks, dev, test, ops, release_date, docs_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
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
      ]
    );
    return result;
  },

  async update(id, project) {
    const db = getDb();
    if (!db) return null;
    
    await db.exec(
      `UPDATE projects 
       SET name = $1, type = $2, description = $3, status = $4, start_date = $5, end_date = $6, 
           remarks = $7, dev = $8, test = $9, ops = $10, release_date = $11, docs_url = $12
       WHERE id = $13`,
      [
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
      ]
    );
    return await this.getById(id);
  },

  async delete(id) {
    const db = getDb();
    if (!db) return null;
    
    // Delete all tasks in this project
    await db.exec('DELETE FROM tasks WHERE project_id = $1', [id]);
    // Delete the project
    await db.exec('DELETE FROM projects WHERE id = $1', [id]);
    return { success: true };
  },

  async updateSortOrder(projectOrders) {
    const db = getDb();
    if (!db) return null;
    
    for (const { id, sort_order } of projectOrders) {
      await db.exec(
        'UPDATE projects SET sort_order = $1 WHERE id = $2',
        [sort_order, id]
      );
    }
    return { success: true };
  }
};

export default Project;
