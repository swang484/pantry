"use client";
import Link from "next/link";
import React, { useEffect, useState, useMemo } from "react";
import Pantry from "./Pantry";

// Seed list (shown immediately on first paint, then merged with backend items when they load)
const SEED_ITEMS = [
    "rice",
    "carrot",
    "lobster",
    "milk",
    "steak"
];

// Optional image mapping for known items (public/ assets are served from root path "/")
// Keys are lowercase item names; add aliases if receipt parsing varies naming.
const IMAGE_MAP: Record<string, string> = {
    steak: "/food_steak.png",
    beef: "/food_steak.png",      // alias in case backend returns "beef"
    rice: "/food_rice.png",
    milk: "/food_milk.png",
    lobster: "/food_lobster.png",
    carrot: "/food_carrot.png"
};

interface DBPantryItem { id: number; name: string; quantity: string; expiry: string | null; }
interface PantryStats { totalItems: number; expiringSoon: number; }
interface LayoutProps { children: React.ReactNode; }

export default function Layout({ children }: LayoutProps) {
    const [dbItems, setDbItems] = useState<DBPantryItem[]>([]);
    const [stats, setStats] = useState<PantryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Manual add form state
    const [showAddForm, setShowAddForm] = useState(false);
    const [addName, setAddName] = useState('');
    const [addQty, setAddQty] = useState('1');
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [removing, setRemoving] = useState(false);
    const [removeName, setRemoveName] = useState('');
    const [showRemoveForm, setShowRemoveForm] = useState(false);

    // Fetch backend pantry + stats
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
                    setDbItems(itemsJson);
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

    // Aggregate DB items (collapse duplicates; count occurrences as quantity)
    const aggregatedNames = useMemo(() => {
        if (!dbItems.length) return [] as { name: string; count: number }[];
        const counts: Record<string, number> = {};
        for (const it of dbItems) {
            const key = it.name.trim();
            const numericQty = parseInt(it.quantity, 10);
            const add = isNaN(numericQty) ? 1 : numericQty;
            counts[key] = (counts[key] || 0) + add;
        }
        return Object.entries(counts).map(([name, count]) => ({ name, count }));
    }, [dbItems]);

    // Merge seed + backend names (preserve seed ordering first, then new names)
    const mergedPantryItems = useMemo(() => {
        const seen = new Set<string>();
        // Build a quick lookup for counts
        const countMap: Record<string, number> = {};
        for (const a of aggregatedNames) {
            countMap[a.name.toLowerCase()] = a.count;
        }
        const list: { name: string; score: number; image?: string; quantity: number }[] = [];
        // Seed first (use DB count if present, else 1)
        for (const seed of SEED_ITEMS) {
            const key = seed.toLowerCase();
            const qty = countMap[key] || 1;
            seen.add(key);
            list.push({
                name: seed,
                score: 4,
                image: IMAGE_MAP[key],
                quantity: qty
            });
        }
        // Add dynamic ones not already present
        for (const dyn of aggregatedNames) {
            const key = dyn.name.toLowerCase();
            if (!seen.has(key)) {
                list.push({
                    name: dyn.name,
                    score: Math.min(8, 2 + dyn.count),
                    image: IMAGE_MAP[key],
                    quantity: dyn.count
                });
            }
        }
        return list;
    }, [aggregatedNames]);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (adding) return;
        const name = addName.trim();
        const quantity = addQty.trim();
        if (!name) { setAddError('Name required'); return; }
        const num = parseInt(quantity, 10);
        if (isNaN(num) || num <= 0) { setAddError('Quantity must be positive'); return; }
        setAdding(true);
        setAddError(null);
        try {
            const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
            const resp = await fetch(`${backendBase}/api/pantry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, quantity: String(num) })
            });
            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(`Add failed (${resp.status}) ${text}`);
            }
            setAddName('');
            setAddQty('1');
            setShowAddForm(false);
            window.dispatchEvent(new CustomEvent('pantry:refresh'));
        } catch (e: any) {
            setAddError(e.message || 'Failed to add');
        } finally {
            setAdding(false);
        }
    }

    async function handleClearAll() {
        if (!confirm('Clear ALL pantry items?')) return;
        const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
        try {
            const resp = await fetch(`${backendBase}/api/pantry`, { method: 'DELETE' });
            if (!resp.ok) throw new Error(`Clear failed: ${resp.status}`);
            window.dispatchEvent(new CustomEvent('pantry:refresh'));
        } catch (e: any) {
            alert(e.message || 'Failed to clear');
        }
    }

    async function handleRemove(e: React.FormEvent) {
        e.preventDefault();
        if (removing) return;
        const name = removeName.trim();
        if (!name) { return; }
        if (!confirm(`Remove ALL '${name}' items?`)) return;
        setRemoving(true);
        try {
            const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
            const resp = await fetch(`${backendBase}/api/pantry/by-name/${encodeURIComponent(name)}`, { method: 'DELETE' });
            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(`Remove failed (${resp.status}) ${text}`);
            }
            setRemoveName('');
            setShowRemoveForm(false);
            window.dispatchEvent(new CustomEvent('pantry:refresh'));
        } catch (e: any) {
            alert(e.message || 'Failed to remove item');
        } finally {
            setRemoving(false);
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
                                <Link href="/" className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-gray-100 p-3 rounded-lg transition-colors">
                                    <span className="text-xl">🏠</span>
                                    <span>Home</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/profile" className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-gray-100 p-3 rounded-lg transition-colors">
                                    <span className="text-xl">👤</span>
                                    <span>Profile</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/recipes" className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-gray-100 p-3 rounded-lg transition-colors">
                                    <span className="text-xl">📖</span>
                                    <span>Recipes</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/mashup" className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-gray-100 p-3 rounded-lg transition-colors">
                                    <span className="text-xl">🍽️</span>
                                    <span>Mashup</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/upload" className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-gray-100 p-3 rounded-lg transition-colors">
                                    <span className="text-xl">📤</span>
                                    <span>Upload</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </nav>

                {/* Main Content Area */}
                <main className="flex-1 ml-64 mr-96 p-6">{children}</main>

                {/* Right Sidebar - Pantry (visual style of version 1, dynamic content) */}
                <div className="w-96 h-screen fixed right-0 top-0 overflow-y-auto bg-[#3f1203]">
                    <div className="p-4">
                        <div className="flex gap-2 mt-6 mb-2">
                            <button
                                onClick={() => { setShowAddForm(s => !s); setAddError(null); if (showRemoveForm) setShowRemoveForm(false); }}
                                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-sm font-semibold py-2 rounded-lg transition-colors"
                            >
                                {showAddForm ? 'Cancel' : 'Add Item'}
                            </button>
                            <button
                                onClick={() => { setShowRemoveForm(s => !s); if (showAddForm) setShowAddForm(false); }}
                                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-sm font-semibold py-2 rounded-lg transition-colors"
                            >
                                {showRemoveForm ? 'Cancel' : 'Remove Item'}
                            </button>
                            <button
                                onClick={handleClearAll}
                                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-sm font-semibold py-2 rounded-lg transition-colors border border-amber-300 disabled:opacity-60"
                                disabled={!aggregatedNames.length}
                            >
                                Clear
                            </button>
                        </div>
                        {showAddForm && (
                            <form onSubmit={handleAdd} className="mb-4 bg-amber-900/30 border border-amber-800 rounded-lg p-3 space-y-3">
                                <div>
                                    <label className="block text-xs text-amber-200 mb-1">Name</label>
                                    <input
                                        value={addName}
                                        onChange={e => setAddName(e.target.value)}
                                        className="w-full rounded-md bg-amber-50/10 border border-amber-700 text-amber-50 text-sm px-2 py-1 outline-none focus:ring-2 focus:ring-amber-500"
                                        placeholder="e.g. chicken breast"
                                        disabled={adding}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-amber-200 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={addQty}
                                        onChange={e => setAddQty(e.target.value)}
                                        className="w-full rounded-md bg-amber-50/10 border border-amber-700 text-amber-50 text-sm px-2 py-1 outline-none focus:ring-2 focus:ring-amber-500"
                                        disabled={adding}
                                    />
                                </div>
                                {addError && <p className="text-xs text-red-300">{addError}</p>}
                                <button
                                    type="submit"
                                    disabled={adding}
                                    className="w-full bg-amber-100 hover:bg-amber-200 text-amber-900 disabled:opacity-60 text-sm font-semibold py-2 rounded-md border border-amber-300"
                                >
                                    {adding ? 'Adding...' : 'Save Item'}
                                </button>
                            </form>
                        )}
                        {showRemoveForm && (
                            <form onSubmit={handleRemove} className="mb-4 bg-amber-900/30 border border-amber-800 rounded-lg p-3 space-y-3">
                                <div>
                                    <label className="block text-xs text-amber-200 mb-1">Item Name To Remove (ALL)</label>
                                    <input
                                        value={removeName}
                                        onChange={e => setRemoveName(e.target.value)}
                                        className="w-full rounded-md bg-amber-50/10 border border-amber-700 text-amber-50 text-sm px-2 py-1 outline-none focus:ring-2 focus:ring-amber-500"
                                        placeholder="e.g. rice"
                                        disabled={removing}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={removing || !removeName.trim()}
                                    className="w-full bg-amber-100 hover:bg-amber-200 text-amber-900 disabled:opacity-60 text-sm font-semibold py-2 rounded-md border border-amber-300"
                                >
                                    {removing ? 'Removing...' : 'Remove All'}
                                </button>
                            </form>
                        )}
                    </div>
                    <Pantry items={mergedPantryItems} />
                </div>
            </div>
        </div>
    );
}