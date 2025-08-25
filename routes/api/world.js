const express = require('express');
const WorldBuilding = require('../../models/WorldBuilding');
const router = express.Router();

// Get world building elements by project ID
router.get('/project/:projectId', async (req, res) => {
  try {
    const worldElements = await WorldBuilding.findByProjectId(req.params.projectId);
    res.json(worldElements);
  } catch (error) {
    console.error('Error fetching world building elements:', error);
    res.status(500).json({ error: 'Failed to fetch world building elements' });
  }
});

// Get world building elements by project ID and type
router.get('/project/:projectId/type/:type', async (req, res) => {
  try {
    const worldElements = await WorldBuilding.findByType(req.params.projectId, req.params.type);
    res.json(worldElements);
  } catch (error) {
    console.error('Error fetching world building elements by type:', error);
    res.status(500).json({ error: 'Failed to fetch world building elements' });
  }
});

// Get types summary for project
router.get('/project/:projectId/summary', async (req, res) => {
  try {
    const summary = await WorldBuilding.getTypesSummary(req.params.projectId);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching world building summary:', error);
    res.status(500).json({ error: 'Failed to fetch world building summary' });
  }
});

// Get world building element by ID
router.get('/:id', async (req, res) => {
  try {
    const worldElement = await WorldBuilding.findById(req.params.id);
    if (!worldElement) {
      return res.status(404).json({ error: 'World building element not found' });
    }
    res.json(worldElement);
  } catch (error) {
    console.error('Error fetching world building element:', error);
    res.status(500).json({ error: 'Failed to fetch world building element' });
  }
});

// Create new world building element
router.post('/', async (req, res) => {
  try {
    const { project_id, type, name, description, details } = req.body;
    
    if (!project_id || !type || !name) {
      return res.status(400).json({ error: 'Project ID, type, and name are required' });
    }

    // Validate type
    const validTypes = ['location', 'culture', 'rule', 'organization'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be one of: ' + validTypes.join(', ') });
    }

    const elementId = await WorldBuilding.create({
      project_id,
      type,
      name,
      description,
      details
    });
    
    const worldElement = await WorldBuilding.findById(elementId);
    res.status(201).json(worldElement);
  } catch (error) {
    console.error('Error creating world building element:', error);
    res.status(500).json({ error: 'Failed to create world building element' });
  }
});

// Update world building element
router.put('/:id', async (req, res) => {
  try {
    const { type, name, description, details } = req.body;
    
    if (!type || !name) {
      return res.status(400).json({ error: 'Type and name are required' });
    }

    // Validate type
    const validTypes = ['location', 'culture', 'rule', 'organization'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be one of: ' + validTypes.join(', ') });
    }

    const worldElement = await WorldBuilding.update(req.params.id, {
      type,
      name,
      description,
      details
    });
    
    if (!worldElement) {
      return res.status(404).json({ error: 'World building element not found' });
    }
    
    res.json(worldElement);
  } catch (error) {
    console.error('Error updating world building element:', error);
    res.status(500).json({ error: 'Failed to update world building element' });
  }
});

// Delete world building element
router.delete('/:id', async (req, res) => {
  try {
    await WorldBuilding.delete(req.params.id);
    res.json({ message: 'World building element deleted successfully' });
  } catch (error) {
    console.error('Error deleting world building element:', error);
    res.status(500).json({ error: 'Failed to delete world building element' });
  }
});

module.exports = router;