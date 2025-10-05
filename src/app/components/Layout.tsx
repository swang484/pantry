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
        <div className="min-h-screen" style={{ backgroundColor: '#f5eeeb' }}>
            <div className="flex">
                {/* Left Navigation Bar */}
                <nav className="w-64 shadow-lg h-screen fixed left-0 top-0 overflow-y-auto" style={{ backgroundColor: '#ded0ca' }}>
                    <div className="p-6">
                        <h1 className="text-2xl font-bold text-gray-800 mb-8">Pantry</h1>
                        <ul className="space-y-4">
                            <li>
                                <Link href="/" className="flex items-center space-x-3 text-gray-700 hover:text-pink-600 p-3 rounded-lg transition-colors" style={{ '--hover-bg': '#b8a399' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b8a399'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" clipRule="evenodd" />
                                    </svg>
                                    <span>Home</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/upload" className="flex items-center space-x-3 text-gray-700 hover:text-pink-600 p-3 rounded-lg transition-colors" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b8a399'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>Upload</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/recipes" className="flex items-center space-x-3 text-gray-700 hover:text-pink-600 p-3 rounded-lg transition-colors" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b8a399'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                                    </svg>
                                    <span>Recipes</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/jam" className="flex items-center space-x-3 text-gray-700 hover:text-pink-600 p-3 rounded-lg transition-colors" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b8a399'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                    </svg>
                                    <span>Jam</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/profile" className="flex items-center space-x-3 text-gray-700 hover:text-pink-600 p-3 rounded-lg transition-colors" onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b8a399'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    <span>Profile</span>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </nav>

                {/* Main Content Area */}
                <main className="flex-1 ml-64 mr-96 p-6">{children}</main>

                {/* Right Sidebar - Pantry (visual style of version 1, dynamic content) */}
                <div className="w-96 h-screen fixed right-0 top-0 overflow-y-auto" style={{ backgroundColor: '#4d3e36' }}>
                    <div className="p-4">
                        <div className="flex gap-2 mt-6 mb-2">
                            <button
                                onClick={() => { setShowAddForm(s => !s); setAddError(null); if (showRemoveForm) setShowRemoveForm(false); }}
                                className="flex-1 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                                style={{ backgroundColor: '#c78883' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b87570'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#c78883'}
                            >
                                {showAddForm ? 'Cancel' : 'Add Item'}
                            </button>
                            <button
                                onClick={() => { setShowRemoveForm(s => !s); if (showAddForm) setShowAddForm(false); }}
                                className="flex-1 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
                                style={{ backgroundColor: '#c78883' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b87570'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#c78883'}
                            >
                                {showRemoveForm ? 'Cancel' : 'Remove Item'}
                            </button>
                            <button
                                onClick={handleClearAll}
                                className="flex-1 bg-pink-200 hover:bg-pink-300 text-pink-900 text-sm font-semibold py-2 rounded-lg transition-colors disabled:opacity-60"
                                disabled={!aggregatedNames.length}
                            >
                                Clear
                            </button>
                        </div>
                        {showAddForm && (
                            <form onSubmit={handleAdd} className="mb-4 rounded-lg p-3 space-y-3" style={{ backgroundColor: 'rgba(201, 182, 171, 0.3)', border: '1px solid #c9b6ab' }}>
                                <div>
                                    <label className="block text-xs mb-1" style={{ color: '#c9b6ab' }}>Name</label>
                                    <input
                                        value={addName}
                                        onChange={e => setAddName(e.target.value)}
                                        className="w-full rounded-md text-sm px-2 py-1 outline-none focus:ring-2 focus:ring-pink-500"
                                        style={{ backgroundColor: '#c9b6ab', border: '1px solid #c9b6ab', color: '#4d3e36' }}
                                        placeholder="e.g. chicken breast"
                                        disabled={adding}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs mb-1" style={{ color: '#c9b6ab' }}>Quantity</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={addQty}
                                        onChange={e => setAddQty(e.target.value)}
                                        className="w-full rounded-md text-sm px-2 py-1 outline-none focus:ring-2 focus:ring-pink-500"
                                        style={{ backgroundColor: '#c9b6ab', border: '1px solid #c9b6ab', color: '#4d3e36' }}
                                        disabled={adding}
                                    />
                                </div>
                                {addError && <p className="text-xs text-red-300">{addError}</p>}
                                <button
                                    type="submit"
                                    disabled={adding}
                                    className="w-full text-white disabled:opacity-60 text-sm font-semibold py-2 rounded-md"
                                    style={{ backgroundColor: '#c78883' }}
                                    onMouseEnter={(e) => !adding && (e.currentTarget.style.backgroundColor = '#b87570')}
                                    onMouseLeave={(e) => !adding && (e.currentTarget.style.backgroundColor = '#c78883')}
                                >
                                    {adding ? 'Adding...' : 'Save Item'}
                                </button>
                            </form>
                        )}
                        {showRemoveForm && (
                            <form onSubmit={handleRemove} className="mb-4 rounded-lg p-3 space-y-3" style={{ backgroundColor: 'rgba(201, 182, 171, 0.3)', border: '1px solid #c9b6ab' }}>
                                <div>
                                    <label className="block text-xs mb-1" style={{ color: '#c9b6ab' }}>Item Name To Remove (ALL)</label>
                                    <input
                                        value={removeName}
                                        onChange={e => setRemoveName(e.target.value)}
                                        className="w-full rounded-md text-sm px-2 py-1 outline-none focus:ring-2 focus:ring-pink-500"
                                        style={{ backgroundColor: '#c9b6ab', border: '1px solid #c9b6ab', color: '#4d3e36' }}
                                        placeholder="e.g. rice"
                                        disabled={removing}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={removing || !removeName.trim()}
                                    className="w-full text-white disabled:opacity-60 text-sm font-semibold py-2 rounded-md"
                                    style={{ backgroundColor: '#c78883' }}
                                    onMouseEnter={(e) => !(removing || !removeName.trim()) && (e.currentTarget.style.backgroundColor = '#b87570')}
                                    onMouseLeave={(e) => !(removing || !removeName.trim()) && (e.currentTarget.style.backgroundColor = '#c78883')}
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