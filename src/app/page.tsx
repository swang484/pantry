"use client";

import { useRouter } from 'next/navigation';
import { usePosts } from './context/PostsContext';
import Layout from "./components/Layout";

export default function Home() {
  const { posts } = usePosts();
  const router = useRouter();

  return (
    <Layout>
      <div className="w-full max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Cooks</h2>

        {/* Twitter-esque Feed */}
        <div className="space-y-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg"
            >
              {/* Post Header */}
              <div className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {post.author.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {post.author}
                    </h3>
                    <p className="text-xs text-gray-500">Just now</p>
                  </div>
                </div>
              </div>

              {/* Post Image */}
              <div className="w-full h-64 bg-gray-100 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Post Content */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {post.title}
                </h3>
                <p className="text-gray-800 mb-3">{post.caption}</p>

                {/* Post Actions */}
                <div className="flex items-center justify-between text-gray-500 text-sm">
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-1 hover:text-red-500">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center space-x-1 hover:text-blue-500">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span>{post.comments} comments</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
