const express = require('express');
const router = express.Router();

// Mock data for pantry items
let pantryItems = [
    { id: 1, name: 'Rice', quantity: '2 lbs', expiry: '2024-02-15' },
    { id: 2, name: 'Chicken Breast', quantity: '1.5 lbs', expiry: '2024-01-20' },
    { id: 3, name: 'Tomatoes', quantity: '6 pieces', expiry: '2024-01-18' },
    { id: 4, name: 'Onions', quantity: '3 pieces', expiry: '2024-02-01' },
    { id: 5, name: 'Garlic', quantity: '1 bulb', expiry: '2024-01-25' },
    { id: 6, name: 'Olive Oil', quantity: '1 bottle', expiry: '2024-06-15' },
    { id: 7, name: 'Pasta', quantity: '3 boxes', expiry: '2024-12-01' },
    { id: 8, name: 'Cheese', quantity: '8 oz', expiry: '2024-01-22' }
];

// GET /api/pantry - Get all pantry items
router.get('/', (req, res) => {
    res.json(pantryItems);
});

// GET /api/pantry/:id - Get specific pantry item
router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const item = pantryItems.find(item => item.id === id);

    if (!item) {
        return res.status(404).json({ error: 'Pantry item not found' });
    }

    res.json(item);
});

// POST /api/pantry - Add new pantry item
router.post('/', (req, res) => {
    const { name, quantity, expiry } = req.body;

    if (!name || !quantity) {
        return res.status(400).json({ error: 'Name and quantity are required' });
    }

    const newItem = {
        id: pantryItems.length + 1,
        name,
        quantity,
        expiry: expiry || null
    };

    pantryItems.push(newItem);
    res.status(201).json(newItem);
});

// PUT /api/pantry/:id - Update pantry item
router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const itemIndex = pantryItems.findIndex(item => item.id === id);

    if (itemIndex === -1) {
        return res.status(404).json({ error: 'Pantry item not found' });
    }

    const { name, quantity, expiry } = req.body;
    pantryItems[itemIndex] = { ...pantryItems[itemIndex], name, quantity, expiry };

    res.json(pantryItems[itemIndex]);
});

// DELETE /api/pantry/:id - Delete pantry item
router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const itemIndex = pantryItems.findIndex(item => item.id === id);

    if (itemIndex === -1) {
        return res.status(404).json({ error: 'Pantry item not found' });
    }

    pantryItems.splice(itemIndex, 1);
    res.json({ message: 'Pantry item deleted successfully' });
});

// GET /api/pantry/stats - Get pantry statistics
router.get('/stats', (req, res) => {
    const totalItems = pantryItems.length;
    const expiringSoon = pantryItems.filter(item => {
        if (!item.expiry) return false;
        const expiryDate = new Date(item.expiry);
        const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        return expiryDate <= sevenDaysFromNow;
    }).length;

    res.json({
        totalItems,
        expiringSoon
    });
});

module.exports = router;
