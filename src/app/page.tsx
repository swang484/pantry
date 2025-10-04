import Layout from "./components/Layout";

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

export default function Home() {
  return (
    <Layout>
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
    </Layout>
  );
}
