import express from 'express';
import Project from '../models/project.js';

const router = express.Router();

// Get all projects in a space
router.get('/space/:spaceId', (req, res) => {
  try {
    const projects = Project.getAllBySpace(req.params.spaceId);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update sort order - must be BEFORE /:id route!
router.put('/sort', (req, res) => {
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
    Project.updateSortOrder(projectOrders);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in projects sort endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single project
router.get('/:id', (req, res) => {
  try {
    const project = Project.getById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create project
router.post('/space/:spaceId', (req, res) => {
  try {
    const project = Project.create(req.params.spaceId, req.body);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update project
router.put('/:id', (req, res) => {
  try {
    const project = Project.update(req.params.id, req.body);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete project
router.delete('/:id', (req, res) => {
  try {
    Project.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
