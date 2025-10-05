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
  tags: {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
  }[];
  likesCount: number;
  commentsCount: number;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPost, setEditingPost] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    image: ''
  });
  const [users, setUsers] = useState<{
    id: number;
    name: string;
    username: string;
    avatar: string | null;
  }[]>([]);
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

        // Fetch profiles for current user and tagging
        const profilesResponse = await fetch(`${backendBase}/api/profiles`);
        if (profilesResponse.ok) {
          const profilesData = await profilesResponse.json();
          setUsers(profilesData);
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

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const response = await fetch(`${backendBase}/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete post: ${response.status}`);
      }

      // Remove the post from the local state
      setPosts(posts.filter(post => post.id !== postId));
    } catch (err: any) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleEditPost = (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setEditingPost(postId);
      setEditFormData({
        title: post.title,
        description: post.description,
        image: post.image
      });
    }
  };

  const handleSaveEdit = async (postId: number) => {
    try {
      const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const response = await fetch(`${backendBase}/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editFormData.title,
          description: editFormData.description,
          image: editFormData.image
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update post: ${response.status}`);
      }

      const updatedPost = await response.json();

      // Update the posts state with the edited post
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, title: updatedPost.title, description: updatedPost.description, image: updatedPost.image }
            : post
        )
      );

      setEditingPost(null);
    } catch (err: any) {
      console.error('Error updating post:', err);
      alert('Failed to update post. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingPost(null);
    setEditFormData({ title: '', description: '', image: '' });
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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

  const handleCreatePost = async (formData: { title: string; description: string; image: string; tagIds: number[] }) => {
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
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-title text-gray-800">Recent Cooks</h1>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="text-white px-4 py-2 rounded-lg font-body-bold transition-colors flex items-center space-x-2"
              style={{ backgroundColor: '#c78883' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b87570'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#c78883'}
            >
              <span>➕</span>
              <span>{showCreateForm ? 'Cancel' : 'Create Post'}</span>
            </button>
          </div>
        </div>

        {/* Create Post Form - always show when toggled */}
        {showCreateForm && (
          <CreatePostForm
            onSubmit={handleCreatePost}
            onCancel={() => setShowCreateForm(false)}
            isCreating={isCreating}
            currentUser={currentUser}
            users={users}
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold overflow-hidden" style={{ backgroundColor: '#c78883' }}>
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
                      <p className="font-body-bold text-gray-800">
                        @{post.profile.username}
                        {post.tags && post.tags.length > 0 && (
                          <span className="text-gray-600 font-body">
                            {' '}with {post.tags.map(tag => `@${tag.username}`).join(', ')}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 font-body">{formatDate(post.createdAt)}</p>
                    </div>
                  </div>

                  {/* Edit and Delete buttons - visible on all posts */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEditPost(post.id)}
                      className="text-gray-400 transition-colors p-1 rounded-full hover:bg-gray-50"
                      style={{ '--hover-color': '#c78883' } as React.CSSProperties}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#c78883'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                      title="Edit post"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                      title="Delete post"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {editingPost === post.id ? (
                  // Edit form
                  <div className="space-y-4">
                    <div>
                      <input
                        type="text"
                        name="title"
                        value={editFormData.title}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900 text-xl font-title"
                        style={{ '--focus-ring': '#c78883' } as React.CSSProperties}
                        onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px #c78883'}
                        onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                        placeholder="Post title"
                      />
                    </div>

                    <div>
                      <textarea
                        name="description"
                        value={editFormData.description}
                        onChange={handleEditFormChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900 resize-none font-body"
                        onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px #c78883'}
                        onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                        placeholder="Post description"
                      />
                    </div>

                    <div>
                      <input
                        type="url"
                        name="image"
                        value={editFormData.image}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900"
                        onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px #c78883'}
                        onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
                        placeholder="Image URL"
                      />
                    </div>

                    {editFormData.image && (
                      <div>
                        <img
                          src={editFormData.image}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSaveEdit(post.id)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // Normal post display
                  <>
                    <h3 className="text-xl font-title text-gray-800 mb-3">{post.title}</h3>

                    <div className="mb-4">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    </div>

                    <p className="text-gray-700 mb-4 font-body">{post.description}</p>
                  </>
                )}

                <div className="flex items-center space-x-6 text-gray-500">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center space-x-2 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{post.likesCount}</span>
                  </button>
                  <button className="flex items-center space-x-2 transition-colors" onMouseEnter={(e) => e.currentTarget.style.color = '#c78883'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
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
function CreatePostForm({ onSubmit, onCancel, isCreating, currentUser, users }: {
  onSubmit: (data: { title: string; description: string; image: string; tagIds: number[] }) => void;
  onCancel: () => void;
  isCreating: boolean;
  currentUser: { id: number; name: string; username: string; avatar: string | null } | null;
  users: { id: number; name: string; username: string; avatar: string | null }[];
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    tagIds: [] as number[]
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

  const handleTagToggle = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(userId)
        ? prev.tagIds.filter(id => id !== userId)
        : [...prev.tagIds, userId]
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-2 border-gray-200">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold overflow-hidden" style={{ backgroundColor: '#c78883' }}>
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
          <h3 className="text-lg font-title text-gray-800">Create New Post</h3>
          <p className="text-sm text-gray-500 font-body">@{currentUser?.username || 'user'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-body-bold text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="What did you cook?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900 font-body"
            onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px #c78883'}
            onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
            disabled={isCreating}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-body-bold text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Tell us about your cooking experience..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 resize-none text-gray-900 font-body"
            onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px #c78883'}
            onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
            disabled={isCreating}
            required
          />
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-body-bold text-gray-700 mb-2">
            Image URL
          </label>
          <input
            type="url"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-gray-900 font-body"
            onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px #c78883'}
            onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
            disabled={isCreating}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Tip: You can use Unsplash URLs like https://images.unsplash.com/photo-...
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tag Users (optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {users
              .filter(user => user.id !== currentUser?.id)
              .map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleTagToggle(user.id)}
                  className={`px-3 py-2 rounded-full text-sm border transition-colors ${formData.tagIds.includes(user.id)
                    ? 'text-white'
                    : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  style={formData.tagIds.includes(user.id) ? { backgroundColor: '#c78883', borderColor: '#c78883' } : {}}
                  onMouseEnter={(e) => !formData.tagIds.includes(user.id) && (e.currentTarget.style.borderColor = '#c78883')}
                  onMouseLeave={(e) => !formData.tagIds.includes(user.id) && (e.currentTarget.style.borderColor = '#d1d5db')}
                  disabled={isCreating}
                >
                  @{user.username}
                </button>
              ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Click to tag users in your post
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
            className="flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#c78883' }}
            onMouseEnter={(e) => !isCreating && (e.currentTarget.style.backgroundColor = '#b87570')}
            onMouseLeave={(e) => !isCreating && (e.currentTarget.style.backgroundColor = '#c78883')}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Post'}
          </button>
        </div>
      </form>
    </div>
  );
}