'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

interface UploadContextType {
  hasSelectedImage: boolean;
  setHasSelectedImage: (value: boolean) => void;
  addToScore: (points: number) => void;
  resetScore: () => void;
  score: number;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [hasSelectedImage, setHasSelectedImage] = useState(false);
  const [score, setScore] = useState(0);
  
  const resetScore = useCallback(() => {
    setScore(0);
  }, []);

  const addToScore = (points: number) => {
    setScore(prev => prev + points);
  };

  const value = useMemo(
    () => ({
      score,
      setScore,
      hasSelectedImage,
      setHasSelectedImage,
      resetScore,
      addToScore,
    }),
    [score, hasSelectedImage, resetScore, addToScore]
  );

  return (
    <UploadContext.Provider value={value}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
}
