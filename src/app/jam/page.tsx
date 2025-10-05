"use client";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";

interface PantryItem {
    id: number;
    name: string;
    quantity: string;
    expiry: string;
}

interface Friend {
    id: number;
    name: string;
    avatar: string;
    ingredients: string[];
}

interface Recipe {
    title: string;
    url: string;
    image: string;
    source: string;
    description?: string;
}

export default function Jam() {
    const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [usedQuery, setUsedQuery] = useState<string | null>(null);
    const [attempts, setAttempts] = useState<number | null>(null);

    // Hardcoded friends with their ingredients
    const friends: Friend[] = [
        {
            id: 1,
            name: "Amber",
            avatar: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=150&h=150&fit=crop&crop=face",
            ingredients: ["chicken breast", "broccoli", "rice", "soy sauce", "garlic", "ginger", "sesame oil", "bell peppers", "carrots", "mushrooms"]
        },
        {
            id: 2,
            name: "Annabel",
            avatar: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=150&h=150&fit=crop&crop=face",
            ingredients: ["salmon", "spinach", "quinoa", "avocado", "tomatoes", "olive oil", "lemon", "feta cheese", "cucumber", "red onion"]
        },
        {
            id: 3,
            name: "Christina",
            avatar: "data:image/jpeg;base64,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",
            ingredients: ["ground beef", "pasta", "tomato sauce", "onions", "cheese", "basil", "oregano", "bell peppers", "zucchini", "eggplant"]
        }
    ];

    // Fetch pantry items on component mount
    useEffect(() => {
        const fetchPantryItems = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/pantry');
                const data = await response.json();
                setPantryItems(data);
            } catch (error) {
                console.error('Failed to fetch pantry items:', error);
            }
        };

        fetchPantryItems();
    }, []);

    const handleJam = async () => {
        if (!selectedFriend) return;
        setIsLoading(true);
        setError(null);
        setUsedQuery(null);
        setAttempts(null);
        try {
            // Collect & combine ingredient names (deduped, lowercased for consistency)
            const myIngredients = pantryItems.map(i => i.name?.toLowerCase().trim()).filter(Boolean);
            const friendIngredients = selectedFriend.ingredients.map(i => i.toLowerCase().trim()).filter(Boolean);
            const combined = Array.from(new Set([...myIngredients, ...friendIngredients]));

            if (!combined.length) {
                setError('No ingredients available to jam up');
                return;
            }

            // The /api/recipes/generate endpoint expects: { ingredients: [{ name: string }, ...] }
            const payload = {
                ingredients: combined.map(name => ({ name }))
            };

            const response = await fetch('http://localhost:3001/api/recipes/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Failed to generate recipes (status ${response.status}) ${text}`);
            }

            const data = await response.json();
            setRecipes(data.recipes || []);
            setUsedQuery(data.usedQuery || null);
            setAttempts(typeof data.attempts === 'number' ? data.attempts : null);
        } catch (e: any) {
            console.error('Error generating jam recipes:', e);
            setError(e.message || 'Failed to generate jam recipes');
            setRecipes([]);
        } finally {
            setIsLoading(false);
        }
    };

    // (formatDate removed; not used in mashup UI)

    return (
        <Layout>
            <div className="max-w-6xl mx-auto p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-title text-gray-800 mb-4">Jam</h1>
                    <p className="text-gray-600 mb-6 font-body">
                        Combine your pantry ingredients with a friend's to create unique collaborative recipes!
                    </p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    {/* Friend Selection */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-title text-gray-800 mb-4">Choose a Friend to Jam With</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {friends.map((friend) => (
                                <button
                                    key={friend.id}
                                    onClick={() => setSelectedFriend(friend)}
                                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${selectedFriend?.id === friend.id
                                        ? 'border-blue-500 bg-blue-50 shadow-md'
                                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <img
                                            src={friend.avatar}
                                            alt={friend.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        <div className="text-left">
                                            <h3 className="font-body-bold text-gray-800">{friend.name}</h3>
                                            <p className="text-sm text-gray-600 font-body">{friend.ingredients.length} ingredients</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ingredients Display */}
                    {selectedFriend && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Your Pantry */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-title text-gray-800 mb-4">Your Pantry</h3>
                                <div className="space-y-2">
                                    {pantryItems.length > 0 ? (
                                        pantryItems.map((item) => (
                                            <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                <span className="text-gray-800 font-body">{item.name}</span>
                                                <span className="text-sm text-gray-500 font-body">{item.quantity}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 italic">No items in your pantry</p>
                                    )}
                                </div>
                            </div>

                            {/* Friend's Ingredients */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-title text-gray-800 mb-4">{selectedFriend.name}'s Pantry</h3>
                                <div className="space-y-2">
                                    {selectedFriend.ingredients.map((ingredient, index) => (
                                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span className="text-gray-800 font-body">{ingredient}</span>
                                            <span className="text-sm text-gray-500 font-body">Available</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mashup Button */}
                    {selectedFriend && (
                        <div className="text-center mb-8">
                            <button
                                onClick={handleJam}
                                disabled={isLoading || pantryItems.length === 0}
                                className="disabled:bg-gray-400 text-white font-body-bold px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                                style={{ backgroundColor: '#c78883' }}
                                onMouseEnter={(e) => !(isLoading || pantryItems.length === 0) && (e.currentTarget.style.backgroundColor = '#b87570')}
                                onMouseLeave={(e) => !(isLoading || pantryItems.length === 0) && (e.currentTarget.style.backgroundColor = '#c78883')}
                            >
                                {isLoading ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Creating Jam...</span>
                                    </div>
                                ) : (
                                    <span>Create Jam Recipe</span>
                                )}
                            </button>
                        </div>
                    )}


                    {/* Recipe Results */}
                    {recipes.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-title text-gray-800 mb-6">Jam Recipes</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                                {recipes.map((recipe, index) => (
                                    <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 w-full max-w-sm">
                                        <div className="p-6">
                                            <h3 className="text-lg font-title text-gray-800 mb-2 line-clamp-2">
                                                {recipe.title}
                                            </h3>
                                            {recipe.description && (
                                                <p className="text-sm text-gray-600 mb-3 line-clamp-3 font-body">
                                                    {recipe.description}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">{recipe.source}</span>
                                                <a
                                                    href={recipe.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                                                    style={{ backgroundColor: '#c78883' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b87570'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#c78883'}
                                                >
                                                    View Recipe
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
