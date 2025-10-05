const express = require('express');
const router = express.Router();

const { prisma } = require('../lib/prisma');

// GET /api/pantry - Get all pantry items
router.get('/', async (req, res) => {
    const items = await prisma.pantryItem.findMany({ orderBy: { id: 'asc' } });
    res.json(items);
});

// IMPORTANT: define stats route before any '/:id' dynamic routes to avoid shadowing
// GET /api/pantry/stats - Get pantry statistics
router.get('/stats', async (req, res) => {
    const items = await prisma.pantryItem.findMany();
    const totalItems = items.length;
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const expiringSoon = items.filter(it => {
        if (!it.expiry) return false;
        const expiryDate = new Date(it.expiry).getTime();
        return expiryDate <= now + sevenDays;
    }).length;
    res.json({ totalItems, expiringSoon });
});

// GET /api/pantry/:id - Get specific pantry item
router.get('/:id', async (req, res) => {
    const id = Number(req.params.id);
    const item = await prisma.pantryItem.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Pantry item not found' });
    res.json(item);
});

// POST /api/pantry - Add new pantry item
router.post('/', async (req, res) => {
    const { name, quantity, expiry } = req.body;
    if (!name || !quantity) return res.status(400).json({ error: 'Name and quantity are required' });
    const created = await prisma.pantryItem.create({ data: { name, quantity, expiry: expiry || null } });
    res.status(201).json(created);
});

// DELETE /api/pantry - Remove all pantry items
router.delete('/', async (req, res) => {
    try {
        const result = await prisma.pantryItem.deleteMany({});
        res.json({ message: 'All pantry items cleared', deleted: result.count });
    } catch (e) {
        res.status(500).json({ error: 'Failed to clear pantry', detail: e.message });
    }
});

// PUT /api/pantry/:id - Update pantry item
router.put('/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { name, quantity, expiry } = req.body;
    try {
        const updated = await prisma.pantryItem.update({ where: { id }, data: { name, quantity, expiry } });
        res.json(updated);
    } catch (e) {
        return res.status(404).json({ error: 'Pantry item not found' });
    }
});

// DELETE /api/pantry/:id - Delete pantry item
router.delete('/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
        await prisma.pantryItem.delete({ where: { id } });
        res.json({ message: 'Pantry item deleted successfully' });
    } catch (e) {
        return res.status(404).json({ error: 'Pantry item not found' });
    }
});


module.exports = router;
