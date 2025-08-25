const { database } = require('../config/database');

class Project {
  static async create(data) {
    const { name, description, genre } = data;
    const result = await database.run(
      'INSERT INTO projects (name, description, genre) VALUES (?, ?, ?)',
      [name, description, genre]
    );
    return result.id;
  }

  static async findById(id) {
    return await database.get('SELECT * FROM projects WHERE id = ?', [id]);
  }

  static async findAll() {
    return await database.all('SELECT * FROM projects ORDER BY updated_at DESC');
  }

  static async update(id, data) {
    const { name, description, genre } = data;
    await database.run(
      'UPDATE projects SET name = ?, description = ?, genre = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, description, genre, id]
    );
    return await this.findById(id);
  }

  static async delete(id) {
    await database.run('DELETE FROM projects WHERE id = ?', [id]);
    return true;
  }

  static async getProjectContext(id) {
    const project = await this.findById(id);
    if (!project) return null;

    const characters = await database.all('SELECT * FROM characters WHERE project_id = ?', [id]);
    const chapters = await database.all('SELECT * FROM chapters WHERE project_id = ? ORDER BY order_index', [id]);
    const worldBuilding = await database.all('SELECT * FROM world_building WHERE project_id = ?', [id]);
    const structure = await database.all('SELECT * FROM story_structure WHERE project_id = ? ORDER BY order_index', [id]);

    return {
      project,
      characters,
      chapters,
      worldBuilding,
      structure
    };
  }
}

module.exports = Project;