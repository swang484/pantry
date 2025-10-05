"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useMemo } from "react";

interface PantryItem {
    id: number;
    name: string;
    quantity: string;
    expiry: string | null;
}

interface PantryStats {
    totalItems: number;
    expiringSoon: number;
}

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const [items, setItems] = useState<PantryItem[]>([]);
    const [stats, setStats] = useState<PantryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
        let abort = false;
        async function load(initial = false) {
            if (initial) setLoading(true);
            try {
                const [itemsRes, statsRes] = await Promise.all([
                    fetch(`${backendBase}/api/pantry`, { cache: 'no-store' }),
                    fetch(`${backendBase}/api/pantry/stats`, { cache: 'no-store' })
                ]);
                if (!itemsRes.ok) throw new Error(`Items fetch failed: ${itemsRes.status}`);
                if (!statsRes.ok) throw new Error(`Stats fetch failed: ${statsRes.status}`);
                const [itemsJson, statsJson] = await Promise.all([itemsRes.json(), statsRes.json()]);
                if (!abort) {
                    setItems(itemsJson);
                    setStats(statsJson);
                    setError(null);
                }
            } catch (e: any) {
                if (!abort) setError(e.message || 'Failed to load pantry data');
            } finally {
                if (!abort) setLoading(false);
            }
        }
        load(true);
        function onRefresh() { load(false); }
        window.addEventListener('pantry:refresh', onRefresh);
        return () => { abort = true; window.removeEventListener('pantry:refresh', onRefresh); };
    }, []);

    const totalItems = stats?.totalItems ?? items.length;
    const expiringSoon = stats?.expiringSoon ?? 0;

    // Aggregate logic: if multiple DB rows share the same name (e.g., receipt added '1' each time),
    // we show a single row with quantity = count of occurrences.
    const aggregated = useMemo(() => {
        if (!items.length) return [] as PantryItem[];
        const counts: Record<string, { name: string; qty: number; expiry: string | null }> = {};
        for (const it of items) {
            const key = it.name.trim().toLowerCase();
            if (!counts[key]) {
                counts[key] = { name: it.name, qty: 1, expiry: it.expiry || null };
            } else {
                counts[key].qty += 1;
                // Keep earliest expiry (if both have expiry dates)
                if (it.expiry && counts[key].expiry) {
                    if (new Date(it.expiry) < new Date(counts[key].expiry!)) {
                        counts[key].expiry = it.expiry;
                    }
                } else if (it.expiry && !counts[key].expiry) {
                    counts[key].expiry = it.expiry;
                }
            }
        }
        // Map back to PantryItem shape (id is synthetic for keying only)
        let syntheticId = 1;
        return Object.values(counts).map(c => ({
            id: syntheticId++,
            name: c.name,
            quantity: String(c.qty),
            expiry: c.expiry
        }));
    }, [items]);

    async function handleClear() {
        if (!confirm('Clear all pantry items? This cannot be undone.')) return;
        const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
        try {
            const resp = await fetch(`${backendBase}/api/pantry`, { method: 'DELETE' });
            if (!resp.ok) throw new Error(`Clear failed: ${resp.status}`);
            // trigger refresh
            window.dispatchEvent(new CustomEvent('pantry:refresh'));
        } catch (e: any) {
            alert(e.message || 'Failed to clear pantry');
        }
    }
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex">
                {/* Left Navigation Bar */}
                <nav className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 overflow-y-auto">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold text-gray-800 mb-8">Pantry</h1>
                        <ul className="space-y-4">
                            <li>
                                <Link
                                    href="/"
                                    className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-gray-100 p-3 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    <span>Home</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/upload"
                                    className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-gray-100 p-3 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span>Upload</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/recipes"
                                    className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-gray-100 p-3 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    <span>Recipes</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/mashup"
                                    className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-gray-100 p-3 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span>Mashup</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/profile"
                                    className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-gray-100 p-3 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>Profile</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </nav>

                {/* Main Content Area */}
                <main className="flex-1 ml-64 mr-120 p-6">
                    {children}
                </main>

                {/* Right Sidebar */}
                <aside className="w-120 bg-white shadow-lg h-screen fixed right-0 top-0 overflow-y-auto">
                    <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Your Pantry</h3>

                        {/* Pantry Items Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-2 font-semibold text-gray-700">Item</th>
                                        <th className="text-left py-3 px-2 font-semibold text-gray-700">Qty</th>
                                        <th className="text-left py-3 px-2 font-semibold text-gray-700">Expires</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && (
                                        <tr><td colSpan={3} className="py-4 text-center text-gray-500">Loading...</td></tr>
                                    )}
                                    {error && !loading && (
                                        <tr><td colSpan={3} className="py-4 text-center text-red-600 text-sm">{error}</td></tr>
                                    )}
                                    {!loading && !error && aggregated.length === 0 && (
                                        <tr><td colSpan={3} className="py-4 text-center text-gray-500">No items yet</td></tr>
                                    )}
                                    {!loading && !error && aggregated.map(item => (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-2 text-gray-800 break-all">{item.name}</td>
                                            <td className="py-3 px-2 text-gray-600">{item.quantity}</td>
                                            <td className="py-3 px-2 text-gray-600">{item.expiry || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Add Item Button */}
                        <div className="flex gap-3 mt-6">
                            <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                                Add Item
                            </button>
                            <button
                                onClick={handleClear}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                                disabled={loading || aggregated.length === 0}
                            >
                                Clear
                            </button>
                        </div>

                        {/* Quick Stats */}
                        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-gray-800 mb-3">Quick Stats</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Items:</span>
                                    <span className="font-semibold">{loading ? '…' : aggregated.reduce((acc, i) => acc + Number(i.quantity || 0), 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Expiring Soon:</span>
                                    <span className="font-semibold text-orange-600">{loading ? '…' : expiringSoon}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Your Points:</span>
                                    <span className="font-semibold text-green-600">1,247</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
