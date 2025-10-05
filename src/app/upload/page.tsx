"use client";
import React, { useState } from "react";
import Layout from "../components/Layout";

interface ReceiptResponse {
    receiptId: string;
    items: string[];
    meta: {
        count: number;
        schemaVersion: string;
        strategy: string;
        timingMs?: number;
    };
    rawText?: string;
    richItems?: { rawLine: string; name: string; display?: string; price?: number | null }[];
}

export default function Upload() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<ReceiptResponse | null>(null);
    const [rawOpen, setRawOpen] = useState(false);
    const [rawText, setRawText] = useState<string | undefined>();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResponse(null);
            setError(null);
            setRawText(undefined);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        setLoading(true);
        setError(null);
        setResponse(null);
        setRawText(undefined);
        try {
            const formData = new FormData();
            formData.append("receipt", file);

            // Adjust backend URL if deployed; currently assumes backend on :3001
            const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
            const res = await fetch(`${backendBase}/api/items/parse?raw=1`, {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({} as any));
                const msg = data.detail ? `${data.error}: ${data.detail}` : (data.error || `Upload failed with status ${res.status}`);
                throw new Error(msg);
            }

            const data = await res.json();
            setResponse(data);
            setRawText(data.rawText);
            // Notify other components (e.g., Layout sidebar) to refresh pantry list
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('pantry:refresh'));
            }
        } catch (err: any) {
            setError(err.message || "Unexpected error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-6xl mx-auto p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-title text-gray-800 mb-4">Receipt Upload & Parsing</h1>
                    <p className="text-gray-600 mb-8 font-body">
                        Upload a receipt image and we'll automatically extract ingredients to add to your pantry!
                    </p>

                    {/* Upload Section */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-200">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-lg font-body-bold text-gray-800 mb-3 flex items-center space-x-2">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#c78883' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>Upload Receipt Image</span>
                                </label>
                                <div className="border-2 border-dashed rounded-xl p-6 text-center transition-colors" style={{ borderColor: '#c78883' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#b87570'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#c78883'}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-body-bold file:text-white hover:file:opacity-80"
                                        style={{ '--file-bg': '#c78883', '--file-hover-bg': '#b87570' } as React.CSSProperties}
                                    />
                                    <p className="text-sm text-gray-500 mt-2 font-body">
                                        Supports JPG, PNG, and other image formats
                                    </p>
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={!file || loading}
                                className="w-full disabled:bg-gray-400 text-white font-body-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                                style={{ backgroundColor: '#c78883' }}
                                onMouseEnter={(e) => !(!file || loading) && (e.currentTarget.style.backgroundColor = '#b87570')}
                                onMouseLeave={(e) => !(!file || loading) && (e.currentTarget.style.backgroundColor = '#c78883')}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Parsing Receipt...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <span>Upload & Parse Receipt</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {error && (
                            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-700 font-body">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Results Section */}
                    {response && (
                        <div className="space-y-6">
                            {/* Success Summary */}
                            <div className="bg-gray-50 rounded-2xl shadow-lg p-6 border border-gray-200">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-title text-gray-800">Receipt Parsed Successfully!</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white rounded-lg p-4 text-center">
                                        <p className="text-2xl font-title" style={{ color: '#99c8c9' }}>{response.meta.count}</p>
                                        <p className="text-sm text-gray-600 font-body">Items Detected</p>
                                    </div>
                                    {response.meta.timingMs != null && (
                                        <div className="bg-white rounded-lg p-4 text-center">
                                            <p className="text-2xl font-title" style={{ color: '#c78883' }}>{(response.meta.timingMs / 1000).toFixed(2)}s</p>
                                            <p className="text-sm text-gray-600 font-body">Parse Time</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Ingredients Added */}
                            {response.items?.length > 0 && (
                                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                                    <h2 className="text-xl font-title text-gray-800 mb-6 flex items-center space-x-2">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#c78883' }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        <span>Ingredients Added to Pantry</span>
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {response.items.map((name, idx) => (
                                            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center space-x-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#c78883' }}></div>
                                                <span className="text-gray-800 font-body">{name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
