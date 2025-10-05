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
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Receipt Upload & Parsing</h1>
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!file || loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 hover:bg-blue-700 transition"
                        >
                            {loading ? "Parsing..." : "Click here to upload!"}
                        </button>
                    </form>
                    {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
                    {response && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-md text-sm space-y-1">
                            <h2 className="font-semibold text-gray-800 mb-2">Receipt Metadata</h2>
                            <p><span className="font-medium text-gray-700">Receipt ID:</span> {response.receiptId}</p>
                            <p><span className="font-medium text-gray-700">Items Detected:</span> {response.meta.count}</p>
                            <p><span className="font-medium text-gray-700">Strategy:</span> {response.meta.strategy}</p>
                            {response.meta.timingMs != null && (
                                <p><span className="font-medium text-gray-700">Parse Time:</span> {response.meta.timingMs} ms</p>
                            )}
                        </div>
                    )}
                </div>

                {response && response.items?.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6 mb-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Parsed Item Names</h2>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800">
                            {response.items.map((name, idx) => (
                                <li key={idx}>{name}</li>
                            ))}
                        </ul>
                        {response.richItems && (
                            <details className="mt-4">
                                <summary className="cursor-pointer text-blue-600 text-sm">Show raw lines</summary>
                                <ul className="mt-2 space-y-1 text-xs font-mono bg-gray-50 p-3 rounded border border-gray-200 max-h-64 overflow-auto">
                                    {response.richItems.map((r, i) => (
                                        <li key={i}>{r.rawLine}</li>
                                    ))}
                                </ul>
                            </details>
                        )}
                    </div>
                )}

                {rawText && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <button
                            onClick={() => setRawOpen(o => !o)}
                            className="mb-4 text-sm text-blue-600 hover:underline"
                        >
                            {rawOpen ? "Hide Raw OCR Text" : "Show Raw OCR Text"}
                        </button>
                        {rawOpen && (
                            <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-4 rounded max-h-96 overflow-auto border border-gray-200">
                                {rawText}
                            </pre>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}
