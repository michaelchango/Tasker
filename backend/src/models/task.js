import { getDb } from '../db.js';

const Task = {
  async getAllByProject(projectId) {
    const db = getDb();
    if (!db) return [];
    return await db.all(
      'SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC',
      [projectId]
    );
  },

  async getById(id) {
    const db = getDb();
    if (!db) return null;
    return await db.get('SELECT * FROM tasks WHERE id = $1', [id]);
  },

  async create(projectId, task) {
    const db = getDb();
    if (!db) return null;
    
    const result = await db.get(
      `INSERT INTO tasks (project_id, name, description, priority, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        projectId,
        task.name,
        task.description || '',
        task.priority || 'medium',
        task.due_date || null,
        task.status || 'todo'
      ]
    );
    return result;
  },

  async update(id, task) {
    const db = getDb();
    if (!db) return null;
    
    await db.exec(
      `UPDATE tasks 
       SET name = $1, description = $2, priority = $3, due_date = $4, status = $5
       WHERE id = $6`,
      [
        task.name,
        task.description || '',
        task.priority || 'medium',
        task.due_date || null,
        task.status || 'todo',
        id
      ]
    );
    return await this.getById(id);
  },

  async delete(id) {
    const db = getDb();
    if (!db) return null;
    await db.exec('DELETE FROM tasks WHERE id = $1', [id]);
    return { success: true };
  }
};

export default Task;
