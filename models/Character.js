const { database } = require('../config/database');

class Character {
  static async create(data) {
    const { project_id, name, description, personality, background, relationships, appearance } = data;
    const result = await database.run(
      'INSERT INTO characters (project_id, name, description, personality, background, relationships, appearance) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [project_id, name, description, personality, background, relationships, appearance]
    );
    return result.id;
  }

  static async findById(id) {
    return await database.get('SELECT * FROM characters WHERE id = ?', [id]);
  }

  static async findByProjectId(projectId) {
    return await database.all('SELECT * FROM characters WHERE project_id = ? ORDER BY created_at', [projectId]);
  }

  static async update(id, data) {
    const { name, description, personality, background, relationships, appearance } = data;
    await database.run(
      'UPDATE characters SET name = ?, description = ?, personality = ?, background = ?, relationships = ?, appearance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, description, personality, background, relationships, appearance, id]
    );
    return await this.findById(id);
  }

  static async delete(id) {
    await database.run('DELETE FROM characters WHERE id = ?', [id]);
    return true;
  }
}

module.exports = Character;