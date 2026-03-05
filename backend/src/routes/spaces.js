import express from 'express';
import Space from '../models/space.js';

const router = express.Router();

// Get all spaces for user
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const spaces = await Space.getAllByUser(userId);
    res.json(spaces);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update sort order - must be BEFORE /:id route!
router.put('/sort', async (req, res) => {
  try {
    let spaceOrders = req.body;
    
    // Handle if data is sent directly as array
    if (Array.isArray(req.body)) {
      spaceOrders = req.body;
    } else if (req.body && req.body.spaceOrders) {
      spaceOrders = req.body.spaceOrders;
    }
    
    if (!spaceOrders || !Array.isArray(spaceOrders) || spaceOrders.length === 0) {
      return res.status(400).json({ error: 'spaceOrders array is required', received: spaceOrders });
    }
    await Space.updateSortOrder(spaceOrders);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in sort endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single space
router.get('/:id', async (req, res) => {
  try {
    const space = await Space.getById(req.params.id);
    if (!space) {
      return res.status(404).json({ error: 'Space not found' });
    }
    res.json(space);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create space
router.post('/', async (req, res) => {
  try {
    const { userId, name } = req.body;
    if (!userId || !name) {
      return res.status(400).json({ error: 'User ID and name are required' });
    }
    const space = await Space.create(userId, name);
    res.status(201).json(space);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update space
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const space = await Space.update(req.params.id, name);
    if (!space) {
      return res.status(404).json({ error: 'Space not found' });
    }
    res.json(space);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete space
router.delete('/:id', async (req, res) => {
  try {
    await Space.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
