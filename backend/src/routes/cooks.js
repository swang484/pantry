const express = require('express');
const router = express.Router();

// Mock data for cooks (formerly posts)
let cooks = [
    {
        id: 1,
        title: "Homemade Pasta with Fresh Basil",
        caption: "Made this amazing pasta dish using ingredients from my pantry! The fresh basil really makes it pop. #pantrycooking #homemade",
        imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=500&h=400&fit=crop",
        author: "chef_sarah",
        pointsEarned: 42,
        likes: 42,
        comments: 8,
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        title: "Quick Stir-Fry with Leftover Vegetables",
        caption: "Nothing beats a quick stir-fry when you need to use up those veggies before they go bad. Added some soy sauce and garlic - perfection! 🍜",
        imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&h=400&fit=crop",
        author: "cooking_mike",
        pointsEarned: 28,
        likes: 28,
        comments: 5,
        createdAt: new Date().toISOString()
    },
    {
        id: 3,
        title: "Overnight Oats with Berries",
        caption: "Prepped these overnight oats last night with some frozen berries from the freezer. Perfect healthy breakfast! #mealprep #healthy",
        imageUrl: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&h=400&fit=crop",
        author: "healthy_jenny",
        pointsEarned: 67,
        likes: 67,
        comments: 12,
        createdAt: new Date().toISOString()
    }
];

// GET /api/cooks - Get all cooks (feed)
router.get('/', (req, res) => {
    res.json(cooks);
});

// GET /api/cooks/:id - Get specific cook
router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const cook = cooks.find(cook => cook.id === id);

    if (!cook) {
        return res.status(404).json({ error: 'Cook not found' });
    }

    res.json(cook);
});

// POST /api/cooks - Create new cook
router.post('/', (req, res) => {
    const { title, caption, imageUrl, author } = req.body;

    if (!title || !caption) {
        return res.status(400).json({ error: 'Title and caption are required' });
    }

    const newCook = {
        id: cooks.length + 1,
        title,
        caption,
        imageUrl: imageUrl || null,
        author: author || 'anonymous',
        pointsEarned: 0,
        likes: 0,
        comments: 0,
        createdAt: new Date().toISOString()
    };

    cooks.push(newCook);
    res.status(201).json(newCook);
});

// PUT /api/cooks/:id - Update cook
router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const cookIndex = cooks.findIndex(cook => cook.id === id);

    if (cookIndex === -1) {
        return res.status(404).json({ error: 'Cook not found' });
    }

    const { title, caption, imageUrl } = req.body;
    cooks[cookIndex] = { ...cooks[cookIndex], title, caption, imageUrl };

    res.json(cooks[cookIndex]);
});

// DELETE /api/cooks/:id - Delete cook
router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const cookIndex = cooks.findIndex(cook => cook.id === id);

    if (cookIndex === -1) {
        return res.status(404).json({ error: 'Cook not found' });
    }

    cooks.splice(cookIndex, 1);
    res.json({ message: 'Cook deleted successfully' });
});

// POST /api/cooks/:id/like - Like/unlike cook
router.post('/:id/like', (req, res) => {
    const id = parseInt(req.params.id);
    const cook = cooks.find(cook => cook.id === id);

    if (!cook) {
        return res.status(404).json({ error: 'Cook not found' });
    }

    // Simple like toggle (in real app, you'd check if user already liked)
    cook.likes += 1;

    res.json({
        message: 'Cook liked!',
        likes: cook.likes
    });
});

// POST /api/cooks/:id/comment - Add comment to cook
router.post('/:id/comment', (req, res) => {
    const id = parseInt(req.params.id);
    const cook = cooks.find(cook => cook.id === id);

    if (!cook) {
        return res.status(404).json({ error: 'Cook not found' });
    }

    const { content, author } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Comment content is required' });
    }

    cook.comments += 1;

    const newComment = {
        id: Date.now(), // Simple ID generation
        content,
        author: author || 'anonymous',
        createdAt: new Date().toISOString()
    };

    res.status(201).json({
        message: 'Comment added!',
        comment: newComment,
        totalComments: cook.comments
    });
});

module.exports = router;
