import express from 'express';
import User from '../models/user.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const existing = await User.getByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const user = await User.create(username, password);
    if (!user) {
      return res.status(500).json({ error: 'Failed to create user' });
    }
    res.status(201).json({ id: user.id, username: user.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const user = await User.verify(username, password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({ id: user.id, username: user.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
