const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');

// GET /api/posts - Get all posts with profile, likes count, and comments count
router.get('/', async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            include: {
                profile: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform the response to include counts
        const postsWithCounts = posts.map(post => ({
            id: post.id,
            title: post.title,
            description: post.description,
            image: post.image,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            profile: post.profile,
            likesCount: post._count.likes,
            commentsCount: post._count.comments
        }));

        res.json(postsWithCounts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// GET /api/posts/:id - Get a specific post with profile, likes, and comments
router.get('/:id', async (req, res) => {
    try {
        const postId = parseInt(req.params.id);

        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                profile: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true
                    }
                },
                likes: {
                    include: {
                        profile: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                avatar: true
                            }
                        }
                    }
                },
                comments: {
                    include: {
                        profile: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                avatar: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json(post);
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// POST /api/posts - Create a new post
router.post('/', async (req, res) => {
    try {
        const { title, description, image, profileId } = req.body;

        if (!title || !description || !image || !profileId) {
            return res.status(400).json({
                error: 'Title, description, image, and profileId are required'
            });
        }

        // Check if profile exists
        const profile = await prisma.profile.findUnique({
            where: { id: parseInt(profileId) }
        });

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const post = await prisma.post.create({
            data: {
                title,
                description,
                image,
                profileId: parseInt(profileId)
            },
            include: {
                profile: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            }
        });

        const postWithCounts = {
            id: post.id,
            title: post.title,
            description: post.description,
            image: post.image,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            profile: post.profile,
            likesCount: post._count.likes,
            commentsCount: post._count.comments
        };

        res.status(201).json(postWithCounts);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// PUT /api/posts/:id - Update a post
router.put('/:id', async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const { title, description, image } = req.body;

        if (!title || !description || !image) {
            return res.status(400).json({
                error: 'Title, description, and image are required'
            });
        }

        const post = await prisma.post.update({
            where: { id: postId },
            data: {
                title,
                description,
                image
            },
            include: {
                profile: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true
                    }
                }
            }
        });

        const postWithCounts = {
            id: post.id,
            title: post.title,
            description: post.description,
            image: post.image,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            profile: post.profile,
            likesCount: post._count.likes,
            commentsCount: post._count.comments
        };

        res.json(postWithCounts);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Post not found' });
        }
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// DELETE /api/posts/:id - Delete a post
router.delete('/:id', async (req, res) => {
    try {
        const postId = parseInt(req.params.id);

        await prisma.post.delete({
            where: { id: postId }
        });

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Post not found' });
        }
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// POST /api/posts/:id/like - Like/unlike a post
router.post('/:id/like', async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const { profileId } = req.body;

        if (!profileId) {
            return res.status(400).json({ error: 'ProfileId is required' });
        }

        // Check if like already exists
        const existingLike = await prisma.like.findUnique({
            where: {
                postId_profileId: {
                    postId,
                    profileId: parseInt(profileId)
                }
            }
        });

        let action;
        if (existingLike) {
            // Unlike the post
            await prisma.like.delete({
                where: {
                    postId_profileId: {
                        postId,
                        profileId: parseInt(profileId)
                    }
                }
            });
            action = 'unliked';
        } else {
            // Like the post
            await prisma.like.create({
                data: {
                    postId,
                    profileId: parseInt(profileId)
                }
            });
            action = 'liked';
        }

        // Get updated like count
        const likesCount = await prisma.like.count({
            where: { postId }
        });

        res.json({
            action,
            likesCount
        });
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ error: 'Failed to toggle like' });
    }
});

// GET /api/posts/:id/comments - Get comments for a post
router.get('/:id/comments', async (req, res) => {
    try {
        const postId = parseInt(req.params.id);

        const comments = await prisma.comment.findMany({
            where: { postId },
            include: {
                profile: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// POST /api/posts/:id/comments - Add a comment to a post
router.post('/:id/comments', async (req, res) => {
    try {
        const postId = parseInt(req.params.id);
        const { content, profileId } = req.body;

        if (!content || !profileId) {
            return res.status(400).json({
                error: 'Content and profileId are required'
            });
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                postId,
                profileId: parseInt(profileId)
            },
            include: {
                profile: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true
                    }
                }
            }
        });

        res.status(201).json(comment);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

module.exports = router;
