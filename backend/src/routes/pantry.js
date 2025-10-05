const express = require('express');
const router = express.Router();

const { prisma } = require('../lib/prisma');

// GET /api/pantry - Get all pantry items
router.get('/', async (req, res) => {
    try {
        const items = await prisma.pantryItem.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pantry items' });
    }
});

// IMPORTANT: define stats route before any '/:id' dynamic routes to avoid shadowing
// GET /api/pantry/stats - Get pantry statistics
router.get('/stats', async (req, res) => {
    try {
        const totalItems = await prisma.pantryItem.count();

        const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const expiringSoon = await prisma.pantryItem.count({
            where: {
                expiry: {
                    not: null,
                    lte: sevenDaysFromNow.toISOString()
                }
            }
        });

        res.json({
            totalItems,
            expiringSoon
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pantry stats' });
    }
});

// GET /api/pantry/:id - Get specific pantry item
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const item = await prisma.pantryItem.findUnique({
            where: { id }
        });

        if (!item) {
            return res.status(404).json({ error: 'Pantry item not found' });
        }

        res.json(item);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pantry item' });
    }
});

// POST /api/pantry - Add new pantry item
router.post('/', async (req, res) => {
    try {
        const { name, quantity, expiry } = req.body;

        if (!name || !quantity) {
            return res.status(400).json({ error: 'Name and quantity are required' });
        }

        const newItem = await prisma.pantryItem.create({
            data: {
                name,
                quantity,
                expiry: expiry || null
            }
        });

        res.status(201).json(newItem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create pantry item' });
    }
});

// PUT /api/pantry/:id - Update pantry item
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, quantity, expiry } = req.body;

        const updatedItem = await prisma.pantryItem.update({
            where: { id },
            data: { name, quantity, expiry }
        });

        res.json(updatedItem);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Pantry item not found' });
        }
        res.status(500).json({ error: 'Failed to update pantry item' });
    }
});

// DELETE /api/pantry/:id - Delete pantry item
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        await prisma.pantryItem.delete({
            where: { id }
        });

        res.json({ message: 'Pantry item deleted successfully' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Pantry item not found' });
        }
        res.status(500).json({ error: 'Failed to delete pantry item' });
    }
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

// DELETE /api/pantry/by-name/:name - Remove ALL rows for a given item name (case-insensitive)
router.delete('/by-name/:name', async (req, res) => {
    try {
        const rawName = req.params.name;
        if (!rawName || !rawName.trim()) {
            return res.status(400).json({ error: 'Item name required' });
        }
        const name = rawName.trim().toLowerCase();
        // SQLite (and some providers) may not support the 'mode' argument; perform manual case-insensitive match.
        const all = await prisma.pantryItem.findMany({ select: { id: true, name: true } });
        const targetIds = all.filter(it => (it.name || '').trim().toLowerCase() === name).map(it => it.id);
        if (!targetIds.length) {
            return res.status(404).json({ error: 'No items found with that name' });
        }
        const del = await prisma.pantryItem.deleteMany({ where: { id: { in: targetIds } } });
        res.json({ message: 'Items removed', name, deleted: del.count });
    } catch (e) {
        res.status(500).json({ error: 'Failed to remove items by name', detail: e.message });
    }
});

module.exports = router;