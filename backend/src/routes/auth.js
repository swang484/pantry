const express = require('express');
const router = express.Router();

// Mock user data (in real app, this would be in a database)
let users = [
    {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123', // In real app, this would be hashed
        points: 150,
        createdAt: new Date().toISOString()
    }
];

// POST /api/auth/register - Register new user
router.post('/register', (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
        return res.status(400).json({ error: 'Email, username, and password are required' });
    }

    // Check if user already exists
    const existingUser = users.find(user =>
        user.email === email || user.username === username
    );

    if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
    }

    const newUser = {
        id: users.length + 1,
        email,
        username,
        password, // In real app, hash this password
        points: 0,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
        message: 'User registered successfully',
        user: userWithoutPassword
    });
});

// POST /api/auth/login - Login user
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = users.find(user => user.email === email);

    if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    res.json({
        message: 'Login successful',
        user: userWithoutPassword
    });
});

// GET /api/auth/me - Get current user (mock implementation)
router.get('/me', (req, res) => {
    // In real app, you'd verify JWT token here
    const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        points: 150,
        createdAt: new Date().toISOString()
    };

    res.json({ user: mockUser });
});

// GET /api/auth/users - Get all users (for testing)
router.get('/users', (req, res) => {
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
});

module.exports = router;
