const express = require('express');
const Chapter = require('../../models/Chapter');
const router = express.Router();

// Get chapters by project ID
router.get('/project/:projectId', async (req, res) => {
  try {
    const chapters = await Chapter.findByProjectId(req.params.projectId);
    res.json(chapters);
  } catch (error) {
    console.error('Error fetching chapters:', error);
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

// Get project statistics
router.get('/project/:projectId/stats', async (req, res) => {
  try {
    const stats = await Chapter.getProjectStats(req.params.projectId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching chapter stats:', error);
    res.status(500).json({ error: 'Failed to fetch chapter statistics' });
  }
});

// Get chapter by ID
router.get('/:id', async (req, res) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    res.json(chapter);
  } catch (error) {
    console.error('Error fetching chapter:', error);
    res.status(500).json({ error: 'Failed to fetch chapter' });
  }
});

// Create new chapter
router.post('/', async (req, res) => {
  try {
    const { project_id, title, content, summary, order_index } = req.body;
    
    if (!project_id || !title) {
      return res.status(400).json({ error: 'Project ID and chapter title are required' });
    }

    const chapterId = await Chapter.create({
      project_id,
      title,
      content: content || '',
      summary,
      order_index
    });
    
    const chapter = await Chapter.findById(chapterId);
    res.status(201).json(chapter);
  } catch (error) {
    console.error('Error creating chapter:', error);
    res.status(500).json({ error: 'Failed to create chapter' });
  }
});

// Update chapter
router.put('/:id', async (req, res) => {
  try {
    const { title, content, summary, status } = req.body;
    
    const chapter = await Chapter.update(req.params.id, {
      title,
      content,
      summary,
      status
    });
    
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    
    res.json(chapter);
  } catch (error) {
    console.error('Error updating chapter:', error);
    res.status(500).json({ error: 'Failed to update chapter' });
  }
});

// Update chapter order
router.put('/:id/order', async (req, res) => {
  try {
    const { order_index } = req.body;
    
    if (order_index === undefined) {
      return res.status(400).json({ error: 'Order index is required' });
    }

    const chapter = await Chapter.updateOrder(req.params.id, order_index);
    
    if (!chapter) {
      return res.status(404).json({ error: 'Chapter not found' });
    }
    
    res.json(chapter);
  } catch (error) {
    console.error('Error updating chapter order:', error);
    res.status(500).json({ error: 'Failed to update chapter order' });
  }
});

// Delete chapter
router.delete('/:id', async (req, res) => {
  try {
    await Chapter.delete(req.params.id);
    res.json({ message: 'Chapter deleted successfully' });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    res.status(500).json({ error: 'Failed to delete chapter' });
  }
});

module.exports = router;