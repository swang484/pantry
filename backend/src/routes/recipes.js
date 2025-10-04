const express = require('express');
const router = express.Router();

// Helper function to build search query from ingredients
const buildRecipeSearchQuery = (ingredients) => {
    const ingredientNames = ingredients.map(item => item.name.toLowerCase());
    const query = `recipe ${ingredientNames.join(' ')} site:foodnetwork.com OR site:allrecipes.com OR site:seriouseats.com OR site:bbcgoodfood.com`;
    return query;
};

// Helper function to process Tavily results into recipe format
const processTavilyResults = (tavilyResults) => {
    return tavilyResults.results.slice(0, 3).map((result, index) => ({
        title: result.title || `Recipe ${index + 1}`,
        url: result.url,
        image: getRecipeImage(result, index),
        source: extractSourceFromUrl(result.url),
        description: result.content ? result.content.substring(0, 150) + '...' : 'Delicious recipe'
    }));
};

// Helper function to get recipe image from Tavily result
const getRecipeImage = (result, index) => {
    // Try to get image from Tavily's image_url field first
    if (result.image_url) {
        return result.image_url;
    }

    // Try to extract from raw_content
    if (result.raw_content?.includes('img')) {
        const imgMatch = result.raw_content.match(/<img[^>]+src="([^"]+)"/i);
        if (imgMatch) {
            return imgMatch[1];
        }
    }

    // Fallback to food-related Unsplash images based on index
    const fallbackImages = [
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop', // Pizza
        'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop', // Pasta
        'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop'  // Stir-fry
    ];

    return fallbackImages[index % fallbackImages.length];
};

// Helper function to extract source name from URL
const extractSourceFromUrl = (url) => {
    try {
        const domain = new URL(url).hostname;
        return domain.replace('www.', '').split('.')[0];
    } catch {
        return 'Recipe Source';
    }
};

// Mock recipe data (fallback when Tavily fails)
const generateMockRecipes = (ingredients) => {
    const mockRecipes = [
        {
            title: "Chicken and Rice Bowl",
            url: "https://example.com/recipe1",
            image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
            source: "Food Network",
            description: "A delicious one-pot meal with chicken and rice"
        },
        {
            title: "Tomato Pasta with Garlic",
            url: "https://example.com/recipe2",
            image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop",
            source: "AllRecipes",
            description: "Simple pasta dish with fresh tomatoes and garlic"
        },
        {
            title: "Garlic Chicken Stir-Fry",
            url: "https://example.com/recipe3",
            image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop",
            source: "Serious Eats",
            description: "Quick and healthy chicken stir-fry with garlic"
        },
        {
            title: "Cheesy Rice Casserole",
            url: "https://example.com/recipe4",
            image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop",
            source: "BBC Good Food",
            description: "Comforting rice casserole with cheese"
        }
    ];

    // Filter recipes based on available ingredients (simple matching)
    const ingredientNames = ingredients.map(item => item.name.toLowerCase());
    return mockRecipes.filter(recipe => {
        const recipeTitle = recipe.title.toLowerCase();
        return ingredientNames.some(ingredient =>
            recipeTitle.includes(ingredient) ||
            ingredient.includes(recipeTitle.split(' ')[0])
        );
    }).slice(0, 3); // Return max 3 recipes
};

// POST /api/recipes/generate - Generate recipes based on pantry items
router.post('/generate', async (req, res) => {
    try {
        const { ingredients } = req.body;

        if (!ingredients || !Array.isArray(ingredients)) {
            return res.status(400).json({
                error: 'Ingredients array is required'
            });
        }

        if (ingredients.length === 0) {
            return res.status(400).json({
                error: 'At least one ingredient is required'
            });
        }

        let recipes;

        try {
            // Try Tavily API first using direct HTTP request
            const searchQuery = buildRecipeSearchQuery(ingredients);
            console.log('Searching for recipes with query:', searchQuery);

            const tavilyResponse = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    api_key: process.env.TAVILY_API_KEY,
                    query: searchQuery,
                    max_results: 3,
                    include_images: true,
                    search_depth: 'basic'
                })
            });

            if (!tavilyResponse.ok) {
                throw new Error(`Tavily API error: ${tavilyResponse.status}`);
            }

            const tavilyResults = await tavilyResponse.json();
            recipes = processTavilyResults(tavilyResults);
            console.log('Tavily found', recipes.length, 'recipes');

        } catch (tavilyError) {
            console.error('Tavily API error:', tavilyError);
            console.log('Falling back to mock recipes');

            // Fallback to mock recipes if Tavily fails
            recipes = generateMockRecipes(ingredients);
        }

        res.json({
            recipes,
            message: `Found ${recipes.length} recipes for your ingredients`
        });

    } catch (error) {
        console.error('Recipe generation error:', error);
        res.status(500).json({
            error: 'Failed to generate recipes'
        });
    }
});

// GET /api/recipes - Get all available recipes (for testing)
router.get('/', (req, res) => {
    const allRecipes = [
        {
            title: "Chicken and Rice Bowl",
            url: "https://example.com/recipe1",
            image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
            source: "Food Network",
            description: "A delicious one-pot meal with chicken and rice"
        },
        {
            title: "Tomato Pasta with Garlic",
            url: "https://example.com/recipe2",
            image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop",
            source: "AllRecipes",
            description: "Simple pasta dish with fresh tomatoes and garlic"
        },
        {
            title: "Garlic Chicken Stir-Fry",
            url: "https://example.com/recipe3",
            image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop",
            source: "Serious Eats",
            description: "Quick and healthy chicken stir-fry with garlic"
        },
        {
            title: "Cheesy Rice Casserole",
            url: "https://example.com/recipe4",
            image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop",
            source: "BBC Good Food",
            description: "Comforting rice casserole with cheese"
        }
    ];

    res.json({ recipes: allRecipes });
});

module.exports = router;
