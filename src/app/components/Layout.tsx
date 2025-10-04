import Link from "next/link";

// Mock data for right sidebar table (will be replaced with API data)
const pantryItems = [
    { name: "Rice", quantity: "2 lbs", expiry: "2024-02-15" },
    { name: "Chicken Breast", quantity: "1.5 lbs", expiry: "2024-01-20" },
    { name: "Tomatoes", quantity: "6 pieces", expiry: "2024-01-18" },
    { name: "Onions", quantity: "3 pieces", expiry: "2024-02-01" },
    { name: "Garlic", quantity: "1 bulb", expiry: "2024-01-25" },
    { name: "Olive Oil", quantity: "1 bottle", expiry: "2024-06-15" },
    { name: "Pasta", quantity: "3 boxes", expiry: "2024-12-01" },
    { name: "Cheese", quantity: "8 oz", expiry: "2024-01-22" }
];

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex">
                {/* Left Navigation Bar */}
                <nav className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 overflow-y-auto">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold text-gray-800 mb-8">Pantry</h1>
                        <ul className="space-y-4">
                            <li>
                                <Link
                                    href="/"
                                    className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-gray-100 p-3 rounded-lg transition-colors"
                                >
                                    <span className="text-xl">🏠</span>
                                    <span>Home</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/profile"
                                    className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-gray-100 p-3 rounded-lg transition-colors"
                                >
                                    <span className="text-xl">👤</span>
                                    <span>Profile</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/recipes"
                                    className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-gray-100 p-3 rounded-lg transition-colors"
                                >
                                    <span className="text-xl">📖</span>
                                    <span>Recipes</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/mashup"
                                    className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-gray-100 p-3 rounded-lg transition-colors"
                                >
                                    <span className="text-xl">🍽️</span>
                                    <span>Mashup</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/upload"
                                    className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-gray-100 p-3 rounded-lg transition-colors"
                                >
                                    <span className="text-xl">📤</span>
                                    <span>Upload</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </nav>

                {/* Main Content Area */}
                <main className="flex-1 ml-64 mr-120 p-6">
                    {children}
                </main>

                {/* Right Sidebar */}
                <aside className="w-120 bg-white shadow-lg h-screen fixed right-0 top-0 overflow-y-auto">
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Your Pantry</h3>

                        {/* Pantry Items Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-2 font-semibold text-gray-700">Item</th>
                                        <th className="text-left py-3 px-2 font-semibold text-gray-700">Qty</th>
                                        <th className="text-left py-3 px-2 font-semibold text-gray-700">Expires</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pantryItems.map((item, index) => (
                                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-2 text-gray-800">{item.name}</td>
                                            <td className="py-3 px-2 text-gray-600">{item.quantity}</td>
                                            <td className="py-3 px-2 text-gray-600">{item.expiry}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Add Item Button */}
                        <button className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                            Add Item
                        </button>

                        {/* Quick Stats */}
                        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-gray-800 mb-3">Quick Stats</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Items:</span>
                                    <span className="font-semibold">{pantryItems.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Expiring Soon:</span>
                                    <span className="font-semibold text-orange-600">3</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Your Points:</span>
                                    <span className="font-semibold text-green-600">1,247</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
