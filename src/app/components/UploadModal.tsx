'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useUpload } from '../context/UploadContext';
import { usePosts } from '../context/PostsContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
}

export default function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [recipeName, setRecipeName] = useState('');
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showPeopleDropdown, setShowPeopleDropdown] = useState(false);
  const [taggedPeople, setTaggedPeople] = useState<string[]>([]);
  
  const windowRef = useRef<HTMLDivElement>(null);
  const peopleDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setHasSelectedImage, score, resetScore } = useUpload();
  const { addPost } = usePosts();
  const router = useRouter();

  // Derive step from selectedImage
  const step = selectedImage ? 2 : 1;

  // Update context when image selection changes
  useEffect(() => {
    setHasSelectedImage(!!selectedImage);
    return () => setHasSelectedImage(false);
  }, [selectedImage, setHasSelectedImage]);

  // Center window on mount
  useEffect(() => {
    if (windowRef.current && isOpen) {
      const x = (window.innerWidth - windowRef.current.offsetWidth) / 2;
      const y = (window.innerHeight - windowRef.current.offsetHeight) / 3;
      setPosition({ x, y });
    }
  }, [isOpen]);

  // Cleanup image URL on unmount
  useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showPeopleDropdown) {
          setShowPeopleDropdown(false);
        } else {
          handleClose();
        }
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, showPeopleDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (peopleDropdownRef.current && !peopleDropdownRef.current.contains(e.target as Node)) {
        setShowPeopleDropdown(false);
      }
    };

    if (showPeopleDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPeopleDropdown]);

  // Memoized drag handlers
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setSelectedFile(file);
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // File drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile && selectedImage) {
      // Add the post to the feed
      addPost({
        title: recipeName || 'Untitled Recipe',
        caption: caption,
        image: selectedImage,
        author: 'You',
      });

      // Upload the file if needed
      onUpload(selectedFile);
      
      // Reset and close
      handleClose();
      
      // Navigate to home page
      router.push('/');
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setCaption('');
    setRecipeName('');
    setTaggedPeople([]);
    setShowPeopleDropdown(false);
    resetScore();
    onClose();
  };

  const handleBack = () => {
    if (step === 2) {
      setSelectedImage(null);
      setSelectedFile(null);
      setCaption('');
      setTaggedPeople([]);
      setShowPeopleDropdown(false);
    } else {
      handleClose();
    }
  };

  const togglePersonTag = (person: string) => {
    setTaggedPeople(prev => 
      prev.includes(person) 
        ? prev.filter(p => p !== person)
        : [...prev, person]
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <motion.div
            ref={windowRef}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto origin-top-left"
            style={{
              position: 'fixed',
              left: `${position.x}px`,
              top: `${position.y}px`,
              cursor: isDragging ? 'grabbing' : 'grab',
              maxHeight: '90vh',
              width: '45%',
              maxWidth: '450px',
              zIndex: 50,
              transform: 'scale(0.8)',
              transformOrigin: 'top left'
            }}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 0.8 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onMouseDown={handleMouseDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <button
                onClick={handleBack}
                className="text-gray-500 hover:text-gray-700"
                aria-label={step === 2 ? "Go back" : "Close modal"}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 id="modal-title" className="text-lg font-semibold">Create Post</h2>
              {step === 2 ? (
                <button
                  onClick={handleUpload}
                  className="text-blue-500 font-medium hover:text-blue-600"
                  aria-label="Share post"
                >
                  Share
                </button>
              ) : (
                <div className="w-6" aria-hidden="true" />
              )}
            </div>

            {/* Image Display Section */}
            {selectedImage ? (
              <div className="w-full bg-gray-100 flex items-center justify-center overflow-hidden border-b border-gray-200" style={{ aspectRatio: '1/1' }}>
                <div className="relative w-full h-full">
                  <Image
                    src={selectedImage}
                    alt="Upload preview"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            ) : (
              <div 
                className={`w-full bg-gray-100 flex items-center justify-center p-8 min-h-[200px] overflow-hidden transition-colors ${
                  isDraggingFile ? 'bg-blue-50 border-2 border-blue-400 border-dashed' : ''
                }`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <div 
                    className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 cursor-pointer hover:bg-gray-300 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        fileInputRef.current?.click();
                      }
                    }}
                    aria-label="Select image"
                  >
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-2">Drag & drop a photo here</p>
                  <p className="text-sm text-gray-500 mb-4">or</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                  >
                    Select from computer
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageSelect}
                    aria-label="File input"
                  />
                </div>
              </div>
            )}
            
            {/* Caption and Details */}
            {step === 2 && (
              <div className="w-full p-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full" aria-hidden="true"></div>
                    <span className="font-medium text-gray-800">Your Username</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div 
                      className="flex items-center justify-center w-8 h-8 bg-amber-500 rounded-full text-white font-bold"
                      aria-label={`Score: ${score}`}
                    >
                      {score}
                    </div>
                    <div className="relative" ref={peopleDropdownRef}>
                      <button 
                        className="flex items-center text-sm text-gray-700 hover:text-gray-900"
                        onClick={() => setShowPeopleDropdown(!showPeopleDropdown)}
                      >
                        <span>People</span>
                        {taggedPeople.length > 0 && (
                          <span className="ml-1 text-blue-500">({taggedPeople.length})</span>
                        )}
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {showPeopleDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                          <button
                            onClick={() => togglePersonTag('Joe')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                          >
                            <span>Joe</span>
                            {taggedPeople.includes('Joe') && (
                              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => togglePersonTag('Bella')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                          >
                            <span>Bella</span>
                            {taggedPeople.includes('Bella') && (
                              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <input
                    type="text"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    placeholder="Enter Recipe Name"
                    className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    aria-label="Recipe Name"
                  />
                </div>
                
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption..."
                  className="w-full p-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-800"
                  rows={3}
                  aria-label="Caption"
                />
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}