const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');

// GET /api/profiles - Get all profiles
router.get('/', async (req, res) => {
    try {
        const profiles = await prisma.profile.findMany({
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                avatar: true,
                bio: true,
                createdAt: true,
                _count: {
                    select: {
                        posts: true,
                        likes: true,
                        comments: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        res.json(profiles);
    } catch (error) {
        console.error('Error fetching profiles:', error);
        res.status(500).json({ error: 'Failed to fetch profiles' });
    }
});

// GET /api/profiles/:id - Get specific profile
router.get('/:id', async (req, res) => {
    try {
        const profileId = parseInt(req.params.id);

        const profile = await prisma.profile.findUnique({
            where: { id: profileId },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                avatar: true,
                bio: true,
                createdAt: true,
                _count: {
                    select: {
                        posts: true,
                        likes: true,
                        comments: true
                    }
                }
            }
        });

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json(profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// POST /api/profiles - Create new profile
router.post('/', async (req, res) => {
    try {
        const { name, username, email, avatar, bio } = req.body;

        if (!name || !username || !email) {
            return res.status(400).json({
                error: 'Name, username, and email are required'
            });
        }

        // Check if username or email already exists
        const existingProfile = await prisma.profile.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingProfile) {
            return res.status(409).json({
                error: 'Username or email already exists'
            });
        }

        const profile = await prisma.profile.create({
            data: {
                name,
                username,
                email,
                avatar: avatar || null,
                bio: bio || null
            },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                avatar: true,
                bio: true,
                createdAt: true
            }
        });

        res.status(201).json(profile);
    } catch (error) {
        console.error('Error creating profile:', error);
        res.status(500).json({ error: 'Failed to create profile' });
    }
});

// PUT /api/profiles/:id - Update profile
router.put('/:id', async (req, res) => {
    try {
        const profileId = parseInt(req.params.id);
        const { name, username, email, avatar, bio } = req.body;

        if (!name || !username || !email) {
            return res.status(400).json({
                error: 'Name, username, and email are required'
            });
        }

        // Check if username or email already exists for other profiles
        const existingProfile = await prisma.profile.findFirst({
            where: {
                AND: [
                    { id: { not: profileId } },
                    {
                        OR: [
                            { username },
                            { email }
                        ]
                    }
                ]
            }
        });

        if (existingProfile) {
            return res.status(409).json({
                error: 'Username or email already exists'
            });
        }

        const profile = await prisma.profile.update({
            where: { id: profileId },
            data: {
                name,
                username,
                email,
                avatar: avatar || null,
                bio: bio || null
            },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                avatar: true,
                bio: true,
                createdAt: true,
                updatedAt: true
            }
        });

        res.json(profile);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Profile not found' });
        }
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// DELETE /api/profiles/:id - Delete profile
router.delete('/:id', async (req, res) => {
    try {
        const profileId = parseInt(req.params.id);

        await prisma.profile.delete({
            where: { id: profileId }
        });

        res.json({ message: 'Profile deleted successfully' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Profile not found' });
        }
        console.error('Error deleting profile:', error);
        res.status(500).json({ error: 'Failed to delete profile' });
    }
});

module.exports = router;
