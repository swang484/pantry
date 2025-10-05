"use client";
import React from 'react';
import { UploadProvider } from './context/UploadContext';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <UploadProvider>{children}</UploadProvider>;
}

export default ClientProviders;