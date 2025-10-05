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

export default function Mashup() {
    const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [isMashing, setIsMashing] = useState(false);

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

    const handleMashup = async () => {
        if (!selectedFriend) return;

        setIsLoading(true);
        setIsMashing(true);
        setError(null);

        try {
            // Combine ingredients from both pantries
            const myIngredients = pantryItems.map(item => item.name.toLowerCase());
            const friendIngredients = selectedFriend.ingredients.map(ingredient => ingredient.toLowerCase());
            const combinedIngredients = [...new Set([...myIngredients, ...friendIngredients])];

            // Simulate visual effect delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Generate recipes using combined ingredients
            const ingredientString = combinedIngredients.join(', ');

            const response = await fetch(`http://localhost:3001/api/recipes?ingredients=${encodeURIComponent(ingredientString)}`);

            if (!response.ok) {
                throw new Error('Failed to generate recipes');
            }

            const data = await response.json();
            setRecipes(data.recipes || []);
        } catch (error: any) {
            console.error('Error generating recipes:', error);
            setError(error.message || 'Failed to generate mashup recipes');
            setRecipes([]);
        } finally {
            setIsLoading(false);
            setTimeout(() => setIsMashing(false), 1000);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <Layout>
            <div className="max-w-6xl mx-auto p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">Mashup</h1>
                    <p className="text-gray-600 mb-6">
                        Combine your pantry ingredients with a friend's to create unique collaborative recipes!
                    </p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    {/* Friend Selection */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Choose a Friend to Mashup With</h2>
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
                                            <h3 className="font-semibold text-gray-800">{friend.name}</h3>
                                            <p className="text-sm text-gray-600">{friend.ingredients.length} ingredients</p>
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
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Pantry</h3>
                                <div className="space-y-2">
                                    {pantryItems.length > 0 ? (
                                        pantryItems.map((item) => (
                                            <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                <span className="text-gray-800">{item.name}</span>
                                                <span className="text-sm text-gray-500">{item.quantity}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 italic">No items in your pantry</p>
                                    )}
                                </div>
                            </div>

                            {/* Friend's Ingredients */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">{selectedFriend.name}'s Pantry</h3>
                                <div className="space-y-2">
                                    {selectedFriend.ingredients.map((ingredient, index) => (
                                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <span className="text-gray-800">{ingredient}</span>
                                            <span className="text-sm text-gray-500">Available</span>
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
                                onClick={handleMashup}
                                disabled={isLoading || pantryItems.length === 0}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Creating Mashup...</span>
                                    </div>
                                ) : (
                                    <span>✨ Create Mashup Recipe ✨</span>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Visual Effect */}
                    {isMashing && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-4">
                                <div className="animate-spin w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">Mixing Ingredients...</h3>
                                <p className="text-gray-600">Combining {pantryItems.length} + {selectedFriend?.ingredients.length} ingredients</p>
                                <div className="mt-4 flex justify-center space-x-2">
                                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
                                    <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recipe Results */}
                    {recipes.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Mashup Recipes</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                                {recipes.map((recipe, index) => (
                                    <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 w-full max-w-sm">
                                        <img
                                            src={recipe.image}
                                            alt={recipe.title}
                                            className="w-full h-48 object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop';
                                            }}
                                        />
                                        <div className="p-6">
                                            <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                                                {recipe.title}
                                            </h3>
                                            {recipe.description && (
                                                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                                                    {recipe.description}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-500">{recipe.source}</span>
                                                <a
                                                    href={recipe.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
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
