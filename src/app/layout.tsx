import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UploadProvider } from "./context/UploadContext";
import { PostsProvider } from "./context/PostsContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pantry App",
  description: "Your personal pantry management and cooking community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UploadProvider>
          <PostsProvider>
            {children}
          </PostsProvider>
        </UploadProvider>
      </body>
    </html>
  );
}
