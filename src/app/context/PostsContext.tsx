"use client";

import { createContext, useContext, ReactNode, useState } from 'react';

interface Post {
  id: number;
  title: string;
  caption: string;
  image: string;
  author: string;
  likes: number;
  comments: number;
}

interface PostsContextType {
  posts: Post[];
  addPost: (post: Omit<Post, 'id' | 'likes' | 'comments'>) => void;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      title: "Homemade Pasta with Fresh Basil",
      caption: "Made this amazing pasta dish using ingredients from my pantry! The fresh basil really makes it pop. #pantrycooking #homemade",
      image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=500&h=400&fit=crop",
      author: "chef_sarah",
      likes: 42,
      comments: 8,
    },
    {
      id: 2,
      title: "Quick Stir-Fry with Leftover Vegetables",
      caption: "Nothing beats a quick stir-fry when you need to use up those veggies before they go bad. Added some soy sauce and garlic - perfection! 🍜",
      image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&h=400&fit=crop",
      author: "cooking_mike",
      likes: 28,
      comments: 5,
    },
    {
      id: 3,
      title: "Overnight Oats with Berries",
      caption: "Prepped these overnight oats last night with some frozen berries from the freezer. Perfect healthy breakfast! #mealprep #healthy",
      image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&h=400&fit=crop",
      author: "healthy_jenny",
      likes: 67,
      comments: 12,
    },
  ]);

  const addPost = (post: Omit<Post, 'id' | 'likes' | 'comments'>) => {
    const newPost: Post = {
      ...post,
      id: Date.now(),
      likes: 0,
      comments: 0,
    };
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  return (
    <PostsContext.Provider value={{ posts, addPost }}>
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
}
