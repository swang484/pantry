import Link from "next/link";
import Pantry from "./Pantry";

// Mock data for right sidebar table
const pantryItems = [
  { name: "Rice", quantity: "2 lbs", expiry: "2024-02-15" },
  { name: "Chicken Breast", quantity: "1.5 lbs", expiry: "2024-01-20" },
  { name: "Tomatoes", quantity: "6 pieces", expiry: "2024-01-18" },
  { name: "Onions", quantity: "3 pieces", expiry: "2024-02-01" },
  { name: "Garlic", quantity: "1 bulb", expiry: "2024-01-25" },
  { name: "Olive Oil", quantity: "1 bottle", expiry: "2024-06-15" },
  { name: "Pasta", quantity: "3 boxes", expiry: "2024-12-01" },
  { name: "Cheese", quantity: "8 oz", expiry: "2024-01-22" },
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
        <main className="flex-1 ml-64 mr-120 p-6">{children}</main>

        {/* Right Sidebar - Pantry */}
        <div className="w-96 h-screen fixed right-0 top-0 overflow-y-auto bg-[#3f1203]">
          <Pantry />
        </div>
      </div>
    </div>
  );
}
