const { database } = require('../config/database');

class Chapter {
  static async create(data) {
    const { project_id, title, content, summary, order_index } = data;
    
    // If no order_index provided, get the next available index
    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined) {
      const lastChapter = await database.get(
        'SELECT MAX(order_index) as max_order FROM chapters WHERE project_id = ?',
        [project_id]
      );
      finalOrderIndex = (lastChapter?.max_order || 0) + 1;
    }

    const wordCount = content ? content.replace(/\s+/g, '').length : 0;

    const result = await database.run(
      'INSERT INTO chapters (project_id, title, content, summary, order_index, word_count) VALUES (?, ?, ?, ?, ?, ?)',
      [project_id, title, content, summary, finalOrderIndex, wordCount]
    );
    return result.id;
  }

  static async findById(id) {
    return await database.get('SELECT * FROM chapters WHERE id = ?', [id]);
  }

  static async findByProjectId(projectId) {
    return await database.all('SELECT * FROM chapters WHERE project_id = ? ORDER BY order_index', [projectId]);
  }

  static async update(id, data) {
    const { title, content, summary, status } = data;
    const wordCount = content ? content.replace(/\s+/g, '').length : 0;
    
    await database.run(
      'UPDATE chapters SET title = ?, content = ?, summary = ?, status = ?, word_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, content, summary, status, wordCount, id]
    );
    return await this.findById(id);
  }

  static async updateOrder(id, newOrderIndex) {
    await database.run(
      'UPDATE chapters SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newOrderIndex, id]
    );
    return await this.findById(id);
  }

  static async delete(id) {
    await database.run('DELETE FROM chapters WHERE id = ?', [id]);
    return true;
  }

  static async getProjectStats(projectId) {
    const stats = await database.get(`
      SELECT 
        COUNT(*) as total_chapters,
        SUM(word_count) as total_words,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_chapters,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_chapters
      FROM chapters 
      WHERE project_id = ?
    `, [projectId]);
    
    return stats;
  }
}

module.exports = Chapter;