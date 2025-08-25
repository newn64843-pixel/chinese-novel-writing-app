const { database } = require('../config/database');

class WorldBuilding {
  static async create(data) {
    const { project_id, type, name, description, details } = data;
    const result = await database.run(
      'INSERT INTO world_building (project_id, type, name, description, details) VALUES (?, ?, ?, ?, ?)',
      [project_id, type, name, description, details]
    );
    return result.id;
  }

  static async findById(id) {
    return await database.get('SELECT * FROM world_building WHERE id = ?', [id]);
  }

  static async findByProjectId(projectId) {
    return await database.all('SELECT * FROM world_building WHERE project_id = ? ORDER BY type, created_at', [projectId]);
  }

  static async findByType(projectId, type) {
    return await database.all('SELECT * FROM world_building WHERE project_id = ? AND type = ? ORDER BY created_at', [projectId, type]);
  }

  static async update(id, data) {
    const { type, name, description, details } = data;
    await database.run(
      'UPDATE world_building SET type = ?, name = ?, description = ?, details = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [type, name, description, details, id]
    );
    return await this.findById(id);
  }

  static async delete(id) {
    await database.run('DELETE FROM world_building WHERE id = ?', [id]);
    return true;
  }

  static async getTypesSummary(projectId) {
    const summary = await database.all(`
      SELECT 
        type,
        COUNT(*) as count
      FROM world_building 
      WHERE project_id = ?
      GROUP BY type
      ORDER BY type
    `, [projectId]);
    
    return summary;
  }
}

module.exports = WorldBuilding;