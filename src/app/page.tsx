"use client";
import Layout from "./components/Layout";
import { useEffect, useState } from "react";

interface Post {
  id: number;
  title: string;
  description: string;
  image: string;
  createdAt: string;
  profile: {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
  };
  likesCount: number;
  commentsCount: number;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    name: string;
    username: string;
    avatar: string | null;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

        // Fetch posts
        const postsResponse = await fetch(`${backendBase}/api/posts`);
        if (!postsResponse.ok) {
          throw new Error(`Failed to fetch posts: ${postsResponse.status}`);
        }
        const postsData = await postsResponse.json();
        setPosts(postsData);

        // For now, we'll use the first profile as the current user
        // In a real app, this would come from authentication
        const profilesResponse = await fetch(`${backendBase}/api/profiles`);
        if (profilesResponse.ok) {
          const profilesData = await profilesResponse.json();
          if (profilesData.length > 0) {
            setCurrentUser(profilesData[0]); // Use first profile as current user
          }
        }

        setError(null);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLike = async (postId: number) => {
    try {
      const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const response = await fetch(`${backendBase}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId: currentUser?.id || 1
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to like post: ${response.status}`);
      }

      const result = await response.json();

      // Update the posts state with new like count
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, likesCount: result.likesCount }
            : post
        )
      );
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreatePost = async (formData: { title: string; description: string; image: string }) => {
    setIsCreating(true);
    try {
      const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const response = await fetch(`${backendBase}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          profileId: currentUser?.id || 1
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create post: ${response.status}`);
      }

      const newPost = await response.json();
      setPosts(prevPosts => [newPost, ...prevPosts]);
      setShowCreateForm(false);
    } catch (err) {
      console.error('Error creating post:', err);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Cooks</h2>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                </div>
                <div className="h-6 bg-gray-300 rounded w-3/4 mb-3"></div>
                <div className="h-64 bg-gray-300 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Cooks</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-2">⚠️ Error loading posts</div>
            <div className="text-gray-600">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Recent Cooks</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
          >
            <span>➕</span>
            <span>{showCreateForm ? 'Cancel' : 'Create Post'}</span>
          </button>
        </div>

        {/* Create Post Form - always show when toggled */}
        {showCreateForm && (
          <CreatePostForm
            onSubmit={handleCreatePost}
            onCancel={() => setShowCreateForm(false)}
            isCreating={isCreating}
            currentUser={currentUser}
          />
        )}

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍳</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Posts Yet</h3>
            <p className="text-gray-600">Be the first to share your cooking creations!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                    {post.profile.avatar ? (
                      <img
                        src={post.profile.avatar}
                        alt={post.profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      post.profile.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">@{post.profile.username}</p>
                    <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
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

                <p className="text-gray-700 mb-4">{post.description}</p>

                <div className="flex items-center space-x-6 text-gray-500">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center space-x-2 hover:text-red-500 transition-colors"
                  >
                    <span>❤️</span>
                    <span>{post.likesCount}</span>
                  </button>
                  <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors">
                    <span>💬</span>
                    <span>{post.commentsCount}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

// Create Post Form Component
function CreatePostForm({ onSubmit, onCancel, isCreating, currentUser }: {
  onSubmit: (data: { title: string; description: string; image: string }) => void;
  onCancel: () => void;
  isCreating: boolean;
  currentUser: { id: number; name: string; username: string; avatar: string | null } | null;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.image) {
      alert('Please fill in all fields');
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-2 border-blue-200">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
          {currentUser?.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-full h-full object-cover"
            />
          ) : (
            currentUser?.name?.charAt(0).toUpperCase() || '?'
          )}
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800">Create New Post</h3>
          <p className="text-sm text-gray-500">@{currentUser?.username || 'user'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="What did you cook?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            disabled={isCreating}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Tell us about your cooking experience..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
            disabled={isCreating}
            required
          />
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
            Image URL
          </label>
          <input
            type="url"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            disabled={isCreating}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Tip: You can use Unsplash URLs like https://images.unsplash.com/photo-...
          </p>
        </div>

        {formData.image && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <img
              src={formData.image}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Post'}
          </button>
        </div>
      </form>
    </div>
  );
}