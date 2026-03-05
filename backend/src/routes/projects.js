import express from 'express';
import Project from '../models/project.js';

const router = express.Router();

// Get all projects in a space
router.get('/space/:spaceId', async (req, res) => {
  try {
    const projects = await Project.getAllBySpace(req.params.spaceId);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update sort order - must be BEFORE /:id route!
router.put('/sort', async (req, res) => {
  try {
    let projectOrders = req.body;
    
    // Handle if data is sent directly as array
    if (Array.isArray(req.body)) {
      projectOrders = req.body;
    } else if (req.body && req.body.projectOrders) {
      projectOrders = req.body.projectOrders;
    }
    
    if (!projectOrders || !Array.isArray(projectOrders) || projectOrders.length === 0) {
      return res.status(400).json({ error: 'projectOrders array is required', received: projectOrders });
    }
    await Project.updateSortOrder(projectOrders);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in projects sort endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single project
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.getById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create project
router.post('/space/:spaceId', async (req, res) => {
  try {
    const project = await Project.create(req.params.spaceId, req.body);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const project = await Project.update(req.params.id, req.body);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    await Project.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
