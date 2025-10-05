const express = require('express');
const router = express.Router();

// Lightweight health / key presence check (no external call)
// GET /api/recipes/health -> { tavily: { keyPresent: boolean, keyLength?: number } }
router.get('/health', (req, res) => {
    const key = process.env.TAVILY_API_KEY || '';
    const keyPresent = !!key;
    // Do NOT return the key itself. keyLength is safe for quick diagnostics.
    res.json({
        tavily: {
            keyPresent,
            keyLength: keyPresent ? key.length : 0,
            note: keyPresent ? 'Key loaded in process environment' : 'Set TAVILY_API_KEY in backend/.env and restart server'
        }
    });
});

// Build tiered search queries focusing on subsets of ingredients rather than ALL at once.
// Strategy:
// 1. Prefer 3-ingredient combos (if enough ingredients)
// 2. Then 2-ingredient combos
// 3. Then single primary ingredient variations (easy, quick, healthy, with second)
// 4. Finally (as fallback) a broad query with all ingredients
function buildTieredQueries(ingredients) {
    const names = ingredients.map(i => (i.name || '').toLowerCase().trim()).filter(Boolean);
    // Deduplicate & keep order (first occurrences more important)
    const unique = [...new Set(names)];
    const limited = unique.slice(0, 8); // cap to avoid overly long queries
    const socialsBlock = '-site:instagram.com -site:facebook.com -site:pinterest.com -site:reddit.com -site:tiktok.com -site:youtube.com';
    const restrictedSites = '(site:foodnetwork.com OR site:allrecipes.com OR site:seriouseats.com OR site:bbcgoodfood.com OR site:epicurious.com OR site:bonappetit.com)';

    function combos(arr, k, limit = 6) {
        const out = [];
        function backtrack(start, path) {
            if (path.length === k) { out.push([...path]); return out.length >= limit; }
            for (let i = start; i < arr.length; i++) {
                path.push(arr[i]);
                const stop = backtrack(i + 1, path);
                path.pop();
                if (stop) return true; // reached limit
            }
            return false;
        }
        backtrack(0, []);
        return out;
    }

    const queries = [];
    // 3-ingredient combos (restricted first)
    if (limited.length >= 3) {
        for (const c of combos(limited, 3, 5)) {
            queries.push(`recipe ${c.join(' ')} ${restrictedSites} ${socialsBlock}`.trim());
        }
    }
    // 2-ingredient combos
    if (limited.length >= 2) {
        for (const c of combos(limited, 2, 6)) {
            queries.push(`recipe ${c.join(' ')} ${restrictedSites} ${socialsBlock}`.trim());
        }
    }
    // Single ingredient variants
    if (limited.length) {
        const primary = limited[0];
        const secondary = limited[1];
        const singleTemplates = [
            `easy ${primary} recipe`,
            `quick ${primary} recipe`,
            `healthy ${primary} recipe`,
        ];
        if (secondary) {
            singleTemplates.push(`${primary} and ${secondary} recipe`);
            singleTemplates.push(`${primary} with ${secondary}`);
        }
        for (const t of singleTemplates) {
            queries.push(`${t} ${restrictedSites} ${socialsBlock}`.trim());
        }
        // Broad non-restricted single primary
        queries.push(`${primary} recipe ${socialsBlock}`.trim());
    }
    // Full ingredient list as LAST fallback (often too restrictive)
    if (limited.length > 1) {
        const allJoined = limited.join(' ');
        queries.push(`recipe ${allJoined} ${socialsBlock}`.trim());
    }
    // Deduplicate while preserving order
    const seen = new Set();
    return queries.filter(q => { if (seen.has(q)) return false; seen.add(q); return true; });
}

async function tavilySearch(query) {
    const body = {
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: 5,
        include_images: true,
        search_depth: 'basic'
    };
    const resp = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const text = await resp.text();
    let json = {};
    try { json = JSON.parse(text); } catch { json = { parseError: true, raw: text.slice(0, 300) }; }
    return { ok: resp.ok, status: resp.status, json, raw: text };
}

// Helper function to process Tavily results into recipe format
function processTavilyResults(tavilyResults) {
    return tavilyResults.results.slice(0, 3).map((result, index) => {
        const image = getRecipeImage(result, index);
        console.log(`[recipes] Processing result ${index}:`, {
            title: result.title,
            image_url: result.image_url,
            images: result.images,
            hasRawContent: !!result.raw_content,
            finalImage: image
        });
        return {
            title: result.title || `Recipe ${index + 1}`,
            url: result.url,
            image: image,
            source: extractSourceFromUrl(result.url),
            description: result.content ? result.content.substring(0, 150) + '...' : 'Delicious recipe'
        };
    });
}

// Helper function to get recipe image from Tavily result
const getRecipeImage = (result, index) => {
    // Try to get image from Tavily's image_url field first
    if (result.image_url && isValidImageUrl(result.image_url)) {
        return result.image_url;
    }

    // Try to extract from images array if available
    if (result.images && Array.isArray(result.images) && result.images.length > 0) {
        for (const img of result.images) {
            if (isValidImageUrl(img)) {
                return img;
            }
        }
    }

    // Try to extract from raw_content with multiple patterns
    if (result.raw_content?.includes('img')) {
        // Try multiple img tag patterns
        const imgPatterns = [
            /<img[^>]+src="([^"]+)"/gi,
            /<img[^>]+src='([^']+)'/gi,
            /data-src="([^"]+)"/gi,
            /data-lazy="([^"]+)"/gi,
            /og:image.*?content="([^"]+)"/gi,
            /twitter:image.*?content="([^"]+)"/gi
        ];

        for (const pattern of imgPatterns) {
            const matches = [...result.raw_content.matchAll(pattern)];
            for (const match of matches) {
                if (match[1] && isValidImageUrl(match[1])) {
                    return match[1];
                }
            }
        }
    }

    // Fallback to food-related Unsplash images based on index
    const fallbackImages = [
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop', // Pizza
        'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop', // Pasta
        'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop', // Stir-fry
        'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop', // Rice bowl
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop', // Pancakes
        'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop', // Salad
        'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=300&fit=crop', // Burger
        'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=300&fit=crop', // Sandwich
        'https://images.unsplash.com/photo-1563379091339-03246963d1d3?w=400&h=300&fit=crop'  // Soup
    ];

    return fallbackImages[index % fallbackImages.length];
};

// Helper function to validate image URLs
const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;

    // Check if it's a valid URL
    try {
        new URL(url);
    } catch {
        return false;
    }

    // Check for common image extensions or known image hosting services
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i;
    const imageHosts = /\.(unsplash|pexels|pixabay|imgur|cloudinary|amazonaws|googleusercontent)\./i;

    return imageExtensions.test(url) || imageHosts.test(url) || url.includes('image') || url.includes('photo');
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
    const placeholderImages = [
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop', // Pizza
        'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop', // Pasta
        'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop', // Stir-fry
        'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop', // Rice bowl
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop', // Pancakes
        'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop', // Salad
        'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=300&fit=crop', // Burger
        'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=300&fit=crop', // Sandwich
        'https://images.unsplash.com/photo-1563379091339-03246963d1d3?w=400&h=300&fit=crop'  // Soup
    ];

    const baseRecipes = [
        {
            title: "Chicken and Rice Bowl",
            url: "https://example.com/recipe1",
            source: "Food Network",
            description: "A delicious one-pot meal with chicken and rice"
        },
        {
            title: "Tomato Pasta with Garlic",
            url: "https://example.com/recipe2",
            source: "AllRecipes",
            description: "Simple pasta dish with fresh tomatoes and garlic"
        },
        {
            title: "Garlic Chicken Stir-Fry",
            url: "https://example.com/recipe3",
            source: "Serious Eats",
            description: "Quick and healthy chicken stir-fry with garlic"
        },
        {
            title: "Cheesy Rice Casserole",
            url: "https://example.com/recipe4",
            source: "BBC Good Food",
            description: "Comforting rice casserole with cheese"
        }
    ];

    // Add images to base recipes
    const mockRecipes = baseRecipes.map((recipe, index) => ({
        ...recipe,
        image: placeholderImages[index % placeholderImages.length]
    }));

    // Filter recipes based on available ingredients (simple matching)
    const ingredientNames = ingredients.map(item => item.name.toLowerCase());
    const filteredRecipes = mockRecipes.filter(recipe => {
        const recipeTitle = recipe.title.toLowerCase();
        return ingredientNames.some(ingredient =>
            recipeTitle.includes(ingredient) ||
            ingredient.includes(recipeTitle.split(' ')[0])
        );
    });

    // If no matches, return the first 3 with different images
    if (filteredRecipes.length === 0) {
        return mockRecipes.slice(0, 3).map((recipe, index) => ({
            ...recipe,
            image: placeholderImages[index % placeholderImages.length]
        }));
    }

    return filteredRecipes.slice(0, 3); // Return max 3 recipes
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

        const queries = buildTieredQueries(ingredients);
        const debug = req.query.debug === '1';
        let aggregateDebug = [];
        let recipes = [];
        let usedQuery = null;
        const blockedDomains = [
            'instagram.com', 'www.instagram.com', 'm.instagram.com',
            'facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.com',
            'pinterest.com', 'www.pinterest.com',
            'reddit.com', 'www.reddit.com', 'old.reddit.com',
            'tiktok.com', 'www.tiktok.com', 'vm.tiktok.com',
            'youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be',
            'x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'
        ];
        const isBlockedHost = (url) => {
            try {
                const h = new URL(url).hostname.toLowerCase();
                return blockedDomains.some(b => h === b || h.endsWith('.' + b));
            } catch { return true; }
        };

        for (const q of queries) {
            try {
                console.log('[recipes] Tavily attempt:', q);
                const r = await tavilySearch(q);
                if (!r.ok) {
                    aggregateDebug.push({ query: q, status: r.status, ok: r.ok, resultCount: 0, note: 'non_ok_status' });
                    continue;
                }
                const tavilyResults = r.json;
                const allResults = Array.isArray(tavilyResults.results) ? tavilyResults.results : [];
                let filtered = allResults.filter(res => res?.url && !isBlockedHost(res.url));
                // Rank filtered results by how many provided ingredients appear in title/content.
                if (filtered.length) {
                    const ingSet = new Set(ingredients.map(i => (i.name || '').toLowerCase()));
                    filtered = filtered.map(r => {
                        const hay = ((r.title || '') + ' ' + (r.content || '')).toLowerCase();
                        let hits = 0;
                        ingSet.forEach(ing => { if (ing && hay.includes(ing)) hits++; });
                        return { ...r, __hits: hits };
                    }).sort((a, b) => (b.__hits || 0) - (a.__hits || 0));
                }
                const blockedCount = allResults.length - filtered.length;
                aggregateDebug.push({ query: q, status: r.status, ok: r.ok, rawCount: allResults.length, blockedFiltered: blockedCount, kept: filtered.length });
                if (filtered.length) {
                    // Mutate structure for downstream processing
                    recipes = processTavilyResults({ results: filtered });
                    usedQuery = q;
                    if (recipes.length) break; // success with non-blocked results
                } else {
                    // No allowed results, proceed to next query
                    continue;
                }
            } catch (e) {
                aggregateDebug.push({ query: q, error: e.message });
            }
        }
        if (!recipes.length) {
            console.warn('[recipes] All Tavily attempts failed or empty. Falling back to mock.');
            recipes = generateMockRecipes(ingredients);
        }
        res.json({
            recipes,
            message: `Found ${recipes.length} recipes (tiered search)`,
            usedQuery,
            attempts: queries.length,
            debug: debug ? aggregateDebug : undefined
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
    const placeholderImages = [
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop', // Pizza
        'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop', // Pasta
        'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop', // Stir-fry
        'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop', // Rice bowl
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop', // Pancakes
        'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop', // Salad
        'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=300&fit=crop', // Burger
        'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=300&fit=crop', // Sandwich
        'https://images.unsplash.com/photo-1563379091339-03246963d1d3?w=400&h=300&fit=crop'  // Soup
    ];

    const allRecipes = [
        {
            title: "Chicken and Rice Bowl",
            url: "https://example.com/recipe1",
            image: placeholderImages[0],
            source: "Food Network",
            description: "A delicious one-pot meal with chicken and rice"
        },
        {
            title: "Tomato Pasta with Garlic",
            url: "https://example.com/recipe2",
            image: placeholderImages[1],
            source: "AllRecipes",
            description: "Simple pasta dish with fresh tomatoes and garlic"
        },
        {
            title: "Garlic Chicken Stir-Fry",
            url: "https://example.com/recipe3",
            image: placeholderImages[2],
            source: "Serious Eats",
            description: "Quick and healthy chicken stir-fry with garlic"
        },
        {
            title: "Cheesy Rice Casserole",
            url: "https://example.com/recipe4",
            image: placeholderImages[3],
            source: "BBC Good Food",
            description: "Comforting rice casserole with cheese"
        }
    ];

    res.json({ recipes: allRecipes });
});

module.exports = router;