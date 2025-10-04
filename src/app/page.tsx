import Link from "next/link";

// Mock data for posts
const posts = [
  {
    id: 1,
    title: "Homemade Pasta with Fresh Basil",
    caption: "Made this amazing pasta dish using ingredients from my pantry! The fresh basil really makes it pop. #pantrycooking #homemade",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=500&h=400&fit=crop",
    author: "chef_sarah",
    likes: 42,
    comments: 8
  },
  {
    id: 2,
    title: "Quick Stir-Fry with Leftover Vegetables",
    caption: "Nothing beats a quick stir-fry when you need to use up those veggies before they go bad. Added some soy sauce and garlic - perfection! 🍜",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&h=400&fit=crop",
    author: "cooking_mike",
    likes: 28,
    comments: 5
  },
  {
    id: 3,
    title: "Overnight Oats with Berries",
    caption: "Prepped these overnight oats last night with some frozen berries from the freezer. Perfect healthy breakfast! #mealprep #healthy",
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&h=400&fit=crop",
    author: "healthy_jenny",
    likes: 67,
    comments: 12
  }
];

// Mock data for right sidebar table
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

export default function Home() {
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
        <main className="flex-1 ml-64 mr-80 p-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Cooks</h2>

            {/* Twitter-esque Feed */}
            <div className="space-y-6">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {post.author.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">@{post.author}</p>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-3">{post.title}</h3>

                  <div className="mb-4">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>

                  <p className="text-gray-700 mb-4">{post.caption}</p>

                  <div className="flex items-center space-x-6 text-gray-500">
                    <button className="flex items-center space-x-2 hover:text-red-500 transition-colors">
                      <span>❤️</span>
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors">
                      <span>💬</span>
                      <span>{post.comments}</span>
                    </button>
                    <button className="flex items-center space-x-2 hover:text-green-500 transition-colors">
                      <span>🔄</span>
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-80 bg-white shadow-lg h-screen fixed right-0 top-0 overflow-y-auto">
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
