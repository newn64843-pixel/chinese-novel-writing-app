const express = require('express');
const Character = require('../../models/Character');
const router = express.Router();

// Get characters by project ID
router.get('/project/:projectId', async (req, res) => {
  try {
    const characters = await Character.findByProjectId(req.params.projectId);
    res.json(characters);
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

// Get character by ID
router.get('/:id', async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    res.json(character);
  } catch (error) {
    console.error('Error fetching character:', error);
    res.status(500).json({ error: 'Failed to fetch character' });
  }
});

// Create new character
router.post('/', async (req, res) => {
  try {
    const { project_id, name, description, personality, background, relationships, appearance } = req.body;
    
    if (!project_id || !name) {
      return res.status(400).json({ error: 'Project ID and character name are required' });
    }

    const characterId = await Character.create({
      project_id,
      name,
      description,
      personality,
      background,
      relationships,
      appearance
    });
    
    const character = await Character.findById(characterId);
    res.status(201).json(character);
  } catch (error) {
    console.error('Error creating character:', error);
    res.status(500).json({ error: 'Failed to create character' });
  }
});

// Update character
router.put('/:id', async (req, res) => {
  try {
    const { name, description, personality, background, relationships, appearance } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Character name is required' });
    }

    const character = await Character.update(req.params.id, {
      name,
      description,
      personality,
      background,
      relationships,
      appearance
    });
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    res.json(character);
  } catch (error) {
    console.error('Error updating character:', error);
    res.status(500).json({ error: 'Failed to update character' });
  }
});

// Delete character
router.delete('/:id', async (req, res) => {
  try {
    await Character.delete(req.params.id);
    res.json({ message: 'Character deleted successfully' });
  } catch (error) {
    console.error('Error deleting character:', error);
    res.status(500).json({ error: 'Failed to delete character' });
  }
});

module.exports = router;