"use client";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";

interface PantryItem {
    id: number;
    name: string;
    quantity: string;
    expiry: string;
}

interface Recipe {
    title: string;
    url: string;
    image: string;
    source: string;
    description?: string;
}

export default function Recipes() {
    const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    // Mock recipe data for testing
    const mockRecipes: Recipe[] = [
        {
            title: "Chicken and Rice Bowl",
            url: "https://example.com/recipe1",
            image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
            source: "Food Network"
        },
        {
            title: "Tomato Pasta with Garlic",
            url: "https://example.com/recipe2",
            image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop",
            source: "AllRecipes"
        },
        {
            title: "Garlic Chicken Stir-Fry",
            url: "https://example.com/recipe3",
            image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop",
            source: "Serious Eats"
        },
        {
            title: "Cheesy Rice Casserole",
            url: "https://example.com/recipe4",
            image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop",
            source: "BBC Good Food"
        }
    ];

    const handleGenerateRecipes = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:3001/api/recipes/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ingredients: pantryItems
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to generate recipes: ${response.status}`);
            }

            const data = await response.json();
            console.log('API response:', data);
            setRecipes(data.recipes);
        } catch (error) {
            console.error('Error generating recipes:', error);
            setError('Failed to generate recipes. Please try again.');
            // Fallback to mock recipes on error
            setRecipes(mockRecipes);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-6xl mx-auto p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-title text-gray-800 mb-4">Recipe Generator</h1>
                    <p className="text-gray-600 mb-6 font-body">
                        Generate recipes based on your pantry items: {pantryItems.map(item => item.name).join(', ')}
                    </p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleGenerateRecipes}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-body-bold px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Generating Recipes...</span>
                            </div>
                        ) : (
                            "Generate Recipes"
                        )}
                    </button>
                </div>

                {/* Recipe Cards */}
                {recipes.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                        {recipes.map((recipe, index) => (
                            <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 w-full max-w-sm">
                                <img
                                    src={recipe.image}
                                    alt={recipe.title}
                                    className="w-full h-48 object-cover"
                                    onError={(e) => {
                                        console.log('Image failed to load:', recipe.image);
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop';
                                    }}
                                />
                                <div className="p-6">
                                    <h3 className="text-lg font-title text-gray-800 mb-2 line-clamp-2">
                                        {recipe.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-2 font-body">
                                        Source: {recipe.source}
                                    </p>
                                    {recipe.description && (
                                        <p className="text-sm text-gray-500 mb-4 line-clamp-2 font-body">
                                            {recipe.description}
                                        </p>
                                    )}
                                    <a
                                        href={recipe.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-body-bold px-4 py-2 rounded-lg transition-colors duration-200"
                                    >
                                        View Recipe
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {recipes.length === 0 && !isLoading && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🍳</div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Recipes Yet</h3>
                        <p className="text-gray-600">Click "Generate Recipes" to find recipes based on your pantry!</p>
                    </div>
                )}
            </div>
        </Layout>
    );
}
