const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// GET /api/pantry - Get all pantry items
router.get('/', async (req, res) => {
    try {
        const pantryItems = await prisma.pantryItem.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(pantryItems);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pantry items' });
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

module.exports = router;
