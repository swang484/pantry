"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useUpload } from "../context/UploadContext";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Image from "next/image";

interface PantryItem {
  name: string;
  image?: string; // optional image path
  score: number;
  quantity: number;
}

interface FoodItem extends PantryItem {
  id: string;
  disabled?: boolean;
  emoji?: string;
  color?: string;
}

const PANTRY_ITEMS: PantryItem[] = [
  { name: "Lobster", image: "/food_lobster.png", score: 8, quantity: 1 },
  { name: "Rice", image: "/food_rice.png", score: 4, quantity: 1 },
  { name: "Bok Choy", image: "/food_bok_choy.png", score: 4, quantity: 1 },
  { name: "Steak", image: "/food_steak.png", score: 6, quantity: 1 },
  { name: "Carrot", image: "/food_carrot.png", score: 4, quantity: 1 },
  { name: "Milk", image: "/food_milk.png", score: 2, quantity: 1 },
];

const ROW_ITEMS = 3;

interface PantryItemProps {
  id: string;
  name: string;
  image?: string;
  score: number;
  quantity: number;
  onClick: (e: React.MouseEvent) => void;
  disabled: boolean;
  isUploadPage: boolean;
}

function PantryItem({
  id,
  name,
  image,
  score,
  quantity,
  onClick,
  disabled,
  isUploadPage,
}: PantryItemProps) {
  const FALLBACK = "/food_rice.png";
  const [imgSrc, setImgSrc] = useState<string>(image || FALLBACK);

  const handleError = () => {
    if (imgSrc !== FALLBACK) setImgSrc(FALLBACK);
  };

  return (
    <div
      className={`rounded-lg p-4 flex flex-col items-center justify-center transition-all ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : isUploadPage
            ? "cursor-pointer hover:opacity-90 hover:scale-105"
            : "cursor-default"
      }`}
      onClick={onClick}
    >
      <div className="w-16 h-16 relative mb-2">
        <Image
          src={imgSrc}
          alt={name}
          fill
          onError={handleError}
          className="object-contain"
        />
      </div>
      <div className="text-sm font-medium text-amber-50 text-center">{name}</div>
      {!disabled && (
        <div className="absolute -left-[5px] top-[20px] bg-amber-600 text-white rounded-full min-w-6 h-6 px-1 flex items-center justify-center text-[10px] font-bold">
          {quantity}
        </div>
      )}
    </div>
  );
}

function PantryRow({
  items,
  rowIndex,
}: {
  items: PantryItemProps[];
  rowIndex: number;
}) {
  const [position, setPosition] = useState(0);
  const maxPosition = Math.max(0, items.length - ROW_ITEMS);

  const moveLeft = () => setPosition((prev) => Math.max(0, prev - 1));
  const moveRight = () => setPosition((prev) => Math.min(maxPosition, prev + 1));
  const visibleItems = items.slice(position, position + ROW_ITEMS);

  return (
    <div className="relative">
      {position > 0 && (
        <button
          onClick={moveLeft}
          className="absolute -left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-amber-900/50 text-amber-50 flex items-center justify-center z-10 hover:bg-amber-800/80 transition-all hover:scale-110"
          aria-label="Move left"
        >
          <ArrowBackIosIcon style={{ fontSize: 14 }} />
        </button>
      )}
      <div className="flex items-center -space-x-1">
        {visibleItems.map((item) => (
          <motion.div
            key={item.id}
            className="flex flex-col items-center p-3 rounded-lg cursor-pointer group relative"
            whileHover={{ scale: 1.1, rotate: [0, -2, 2, -2, 2, 0] }}
            transition={{ scale: { duration: 0.2 }, rotate: { duration: 0.5 } }}
            onClick={item.onClick}
          >
            <PantryItem {...item} />
          </motion.div>
        ))}
      </div>
      {position < maxPosition && (
        <button
          onClick={moveRight}
          className="absolute -right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-amber-900/50 text-amber-50 flex items-center justify-center z-10 hover:bg-amber-800/80 transition-all hover:scale-110"
          aria-label="Move right"
        >
          <ArrowForwardIosIcon style={{ fontSize: 14 }} />
        </button>
      )}
    </div>
  );
}

interface PantryExternalItem { name: string; score: number; image?: string; quantity: number }
interface PantryProps { items?: PantryExternalItem[] }

export default function Pantry({ items }: PantryProps) {
  const { addToScore } = useUpload();
  const [disabledItems, setDisabledItems] = useState<Set<string>>(new Set());
  const [scoredItems, setScoredItems] = useState<Set<string>>(new Set());
  const [pantryItems, setPantryItems] = useState<PantryItem[]>(items ? items.map(i => ({ ...i })) : PANTRY_ITEMS);
  const pantryRef = useRef<HTMLDivElement>(null);
  const [isUploadPage, setIsUploadPage] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

  useEffect(() => { setIsUploadPage(window.location.pathname === '/create'); }, []);
  useEffect(() => { if (items) setPantryItems(items.map(i => ({ ...i }))); }, [items]);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      const resp = await fetch(`${backendBase}/api/pantry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), quantity: newQuantity.trim() || '1' })
      });
      if (!resp.ok) throw new Error(`Add failed: ${resp.status}`);
      setNewName("");
      setNewQuantity("1");
      setShowAddForm(false);
      window.dispatchEvent(new CustomEvent('pantry:refresh'));
    } catch (err) {
      console.error(err); alert('Failed to add item');
    } finally { setSubmitting(false); }
  }

  async function handleClearAll() {
    if (!confirm('Clear all pantry items? This cannot be undone.')) return;
    setClearing(true);
    try {
      const resp = await fetch(`${backendBase}/api/pantry`, { method: 'DELETE' });
      if (!resp.ok) throw new Error(`Clear failed: ${resp.status}`);
      window.dispatchEvent(new CustomEvent('pantry:refresh'));
    } catch (err) { console.error(err); alert('Failed to clear pantry'); }
    finally { setClearing(false); }
  }

  // Score has been deprecated from UI; keeping addToScore for any future interactions.

  const handleItemClick = (item: FoodItem, e: React.MouseEvent) => {
    if (!isUploadPage || !pantryRef.current) return;
    if (disabledItems.has(item.id)) {
      setPantryItems(prev => prev.filter(i => i.name !== item.name));
      setDisabledItems(prev => { const s = new Set(prev); s.delete(item.id); return s; });
      return;
    }
    if (!scoredItems.has(item.id)) {
      addToScore(Math.ceil(item.score / 2));
      setScoredItems(prev => new Set(prev).add(item.id));
    }
    setDisabledItems(prev => new Set(prev).add(item.id));
  };

  const rows: PantryItemProps[][] = [];
  for (let i = 0; i < pantryItems.length; i += ROW_ITEMS) {
    const row = pantryItems.slice(i, i + ROW_ITEMS).map((item, idx) => {
      const itemId = `item-${i + idx}`;
      const isDisabled = disabledItems.has(itemId);
      return { ...item, id: itemId, disabled: isDisabled, isUploadPage, onClick: (e: React.MouseEvent) => handleItemClick({ ...item, id: itemId, disabled: isDisabled }, e) };
    });
    rows.push(row);
  }

  return (
    <aside ref={pantryRef} className="sticky top-0 h-screen hidden lg:block p-4 bg-[#3f1203] overflow-y-auto w-96 relative">
      <div className="mb-6">
        <input placeholder="Search Pantry..." className="w-full rounded-full border border-amber-900 bg-amber-50/10 text-amber-50 px-4 py-2 outline-none focus:ring-2 focus:ring-amber-500/50 placeholder-amber-100/50" />
      </div>
      <div className="relative">
        <div className="h-1 bg-[#793c1a] rounded-t-lg mb-2"></div>
        <div className="bg-amber-50/5 backdrop-blur-sm rounded-lg p-4">
          <div className="px-4 py-2 font-semibold text-amber-50 text-lg">Pantry</div>
          <div className="space-y-6">
            {rows.map((row, index) => (<PantryRow key={index} items={row} rowIndex={index} />))}
          </div>
          <div className="mt-8 pt-4 border-t border-amber-900/30">
            <div className="flex justify-between items-center">
              <span className="text-amber-100 font-medium">Pantry Items: {pantryItems.length}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setShowAddForm(v => !v)} className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold py-2 px-3 rounded-lg transition disabled:opacity-50" disabled={submitting}>{showAddForm ? 'Cancel' : 'Add Item'}</button>
              <button onClick={handleClearAll} className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold py-2 px-3 rounded-lg transition disabled:opacity-50" disabled={clearing || pantryItems.length === 0}>{clearing ? 'Clearing...' : 'Clear'}</button>
            </div>
            {showAddForm && (
              <form onSubmit={handleAddItem} className="mt-4 space-y-3 bg-amber-50/5 p-3 rounded-lg border border-amber-900/30">
                <div>
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Item name" className="w-full text-sm px-3 py-2 rounded-md bg-amber-900/30 text-amber-50 placeholder-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50" required />
                </div>
                <div>
                  <input value={newQuantity} type="text" onChange={e => setNewQuantity(e.target.value)} placeholder="Quantity" className="w-full text-sm px-3 py-2 rounded-md bg-amber-900/30 text-amber-50 placeholder-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
                </div>
                <button type="submit" disabled={submitting} className="w-full bg-amber-700 hover:bg-amber-600 text-white text-sm font-semibold py-2 rounded-md transition disabled:opacity-50">{submitting ? 'Adding…' : 'Save'}</button>
              </form>
            )}
          </div>
        </div>
        <div className="h-3 bg-[#793c1a] rounded-b-lg mt-2"></div>
      </div>
    </aside>
  );
}