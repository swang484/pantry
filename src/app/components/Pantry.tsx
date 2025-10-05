"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface PantryBaseItem {
  name: string;
  image: string;
  score: number; // legacy (can remove later)
  quantity?: number; // preferred display
}

interface FoodItem extends PantryBaseItem {
  id: string;
  disabled?: boolean;
  emoji?: string;
  color?: string;
}

// Fallback static list when no external items are passed
const FALLBACK_ITEMS: PantryBaseItem[] = [
  { name: "Lobster", image: "/food_lobster.png", score: 8 },
  { name: "Rice", image: "/food_rice.png", score: 4 },
  { name: "Bok Choy", image: "/food_bok_choy.png", score: 4 },
  { name: "Steak", image: "/food_steak.png", score: 6 },
  { name: "Carrot", image: "/food_carrot.png", score: 4 },
  { name: "Milk", image: "/food_milk.png", score: 2 },
];

// Number of columns for vertical grid display
const GRID_COLUMNS = 3;

interface FlyingFood {
  id: string;
  item: FoodItem;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface PantryItemProps {
  id: string;
  name: string;
  image: string;
  score: number;
  quantity?: number;
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
        <Image src={image} alt={name} fill className="object-contain" />
      </div>
      <div className="text-sm font-medium text-amber-50 text-center">
        {name}
      </div>
      {!disabled && (
        <div className="absolute -left-[5px] top-[20px] bg-amber-500 text-white rounded-full min-w-6 h-6 px-1 flex items-center justify-center text-xs font-bold">
          {typeof quantity === 'number' ? quantity : 1}
        </div>
      )}
    </div>
  );
}

// Removed horizontal slider logic; using a simple grid below.

interface ExternalPantryItem {
  name: string;
  image?: string;
  score?: number;
  quantity?: number;
}

export default function Pantry({ items }: { items?: ExternalPantryItem[] }) {
  const [flyingFoods, setFlyingFoods] = useState<FlyingFood[]>([]);
  const [disabledItems, setDisabledItems] = useState<Set<string>>(new Set());
  const [scoredItems, setScoredItems] = useState<Set<string>>(new Set());
  const [pantryItems, setPantryItems] = useState<PantryBaseItem[]>(() => {
    if (items && items.length) {
      return items.map(it => ({
        name: it.name,
        image: it.image || inferImage(it.name),
        score: typeof it.score === 'number' ? it.score : 4,
        quantity: it.quantity
      }));
    }
    return FALLBACK_ITEMS;
  });
  const pantryRef = useRef<HTMLDivElement>(null);
  const [isUploadPage, setIsUploadPage] = useState(false);

  // Update pantry items whenever external items prop changes
  useEffect(() => {
    if (items && items.length) {
      setPantryItems(items.map(it => ({
        name: it.name,
        image: it.image || inferImage(it.name),
        score: typeof it.score === 'number' ? it.score : 4,
        quantity: it.quantity
      })));
    } else if (!items) {
      setPantryItems(FALLBACK_ITEMS);
    }
  }, [items]);

  // Check if we're on the upload page
  useEffect(() => {
    setIsUploadPage(window.location.pathname === '/upload');
  }, []);

  // Scoring removed from UI; legacy score logic can be fully deleted later.

  const emojiMap: Record<string, string> = {
    Lobster: "🦞",
    Rice: "🍚",
    "Bok Choy": "🥬",
    Steak: "🥩",
    Carrot: "🥕",
    Milk: "🥛",
  };

  const handleItemClick = (item: FoodItem, e: React.MouseEvent) => {
    // Don't do anything if not on upload page
    if (!isUploadPage || !pantryRef.current) return;

    // If item is already disabled, remove it from the pantry
    if (disabledItems.has(item.id)) {
      setPantryItems(prev => prev.filter(i => i.name !== item.name));
      setDisabledItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
      return;
    }

    // Only add to score if we haven't scored this item before
    // Score accumulation removed; keep placeholder for future gamification if needed
    if (!scoredItems.has(item.id)) {
      setScoredItems(prev => new Set(prev).add(item.id));
    }
    
    // Disable the item (gray it out)
    setDisabledItems(prev => new Set(prev).add(item.id));

    // Get the position of the pantry for animation
    const pantryRect = pantryRef.current.getBoundingClientRect();

    // Create a new flying food item
    const newFlyingFood: FlyingFood = {
      id: `${item.id}-${Date.now()}`,
      item,
      startX: e.clientX - pantryRect.left,
      startY: e.clientY - pantryRect.top,
      endX: 50, // Left side of the screen
      endY: window.innerHeight / 2 - 50, // Center vertically
    };

    setFlyingFoods(prev => [...prev, newFlyingFood]);
  };

  // Flat list for grid
  const gridItems = pantryItems.map((item, idx) => {
    const itemId = `item-${idx}`;
    const isDisabled = disabledItems.has(itemId);
    return (
      <motion.div
        key={itemId}
        className="flex flex-col items-center p-3 rounded-lg cursor-pointer group relative"
        whileHover={{
          scale: 1.1,
          rotate: [0, -2, 2, -2, 2, 0],
        }}
        transition={{
          scale: { duration: 0.2 },
          rotate: { duration: 0.5 },
        }}
        onClick={(e) =>
          handleItemClick(
            {
              ...item,
              id: itemId,
              disabled: isDisabled,
            },
            e
          )
        }
      >
        <PantryItem
          id={itemId}
          name={item.name}
          image={item.image}
          score={item.score}
          quantity={item.quantity}
          onClick={(e) =>
            handleItemClick(
              {
                ...item,
                id: itemId,
                disabled: isDisabled,
              },
              e
            )
          }
          disabled={isDisabled}
          isUploadPage={isUploadPage}
        />
      </motion.div>
    );
  });

  // Attempt to infer image from name if external items did not provide one
  function inferImage(name: string): string {
    const key = name.toLowerCase();
    if (key.includes('rice')) return '/food_rice.png';
    if (key.includes('lobster')) return '/food_lobster.png';
    if (key.includes('steak') || key.includes('beef')) return '/food_steak.png';
    if (key.includes('carrot')) return '/food_carrot.png';
    if (key.includes('milk')) return '/food_milk.png';
    if (key.includes('bok')) return '/food_bok_choy.png';
    return '/food_rice.png'; // generic fallback
  }

  return (
    <aside
      ref={pantryRef}
      className="sticky top-0 h-screen hidden lg:block p-4 bg-[#3f1203] overflow-y-auto w-96 relative"
    >
      <AnimatePresence>
        {flyingFoods.map(({ id, item, startX, startY, endX, endY }) => {
          const emoji = emojiMap[item.name] || "🍽️";
          return (
            <motion.div
              key={id}
              className="fixed pointer-events-none text-3xl z-50"
              initial={{
                x: startX,
                y: startY,
                opacity: 1,
                scale: 1,
              }}
              animate={{
                x: endX,
                y: endY,
                scale: 0.5,
                opacity: 0,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1,
                ease: "easeOut",
              }}
            >
              {emoji}
            </motion.div>
          );
        })}
      </AnimatePresence>
      {/* Search input removed per request */}
      <div className="relative">
        <div className="h-1 bg-[#793c1a] rounded-t-lg mb-2"></div>

        <div className="bg-amber-50/5 backdrop-blur-sm rounded-lg p-4">
          <div className="px-4 py-2 font-semibold text-amber-50 text-lg">
            Pantry
          </div>

          <div className="grid grid-cols-3 gap-2">
            {gridItems}
          </div>

          <div className="mt-8 pt-4 border-t border-amber-900/30 text-amber-100 text-sm">
            Total items: {pantryItems.length}
          </div>
        </div>

        {/* Bottom ledge */}
        <div className="h-3 bg-[#793c1a] rounded-b-lg mt-2"></div>
      </div>
    </aside>
  );
}