"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUpload } from "../context/UploadContext";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Image from "next/image";

interface PantryBaseItem {
  name: string;
  image: string;
  score: number; // retained for upload scoring logic
  quantity?: number; // new optional quantity (preferred display when provided)
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

const ROW_ITEMS = 3;

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
          {typeof quantity === 'number' ? quantity : `+${score}`}
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

  const moveLeft = () => {
    setPosition((prev) => Math.max(0, prev - 1));
  };

  const moveRight = () => {
    setPosition((prev) => Math.min(maxPosition, prev + 1));
  };

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
        {visibleItems.map((item, index) => (
          <motion.div
            key={item.id}
            className="flex flex-col items-center p-3 rounded-lg cursor-pointer group relative"
            whileHover={{
              scale: 1.1,
              rotate: [0, -2, 2, -2, 2, 0],
            }}
            transition={{
              scale: { duration: 0.2 },
              rotate: { duration: 0.5 },
            }}
            onClick={item.onClick}
          >
            <PantryItem
              id={item.id}
              name={item.name}
              image={item.image}
              score={item.score}
              onClick={item.onClick}
              disabled={item.disabled}
              isUploadPage={item.isUploadPage}
            />
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

interface ExternalPantryItem {
  name: string;
  image?: string;
  score?: number;
  quantity?: number;
}

export default function Pantry({ items }: { items?: ExternalPantryItem[] }) {
  const { score: currentScore, addToScore } = useUpload();
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

  // Total score is just the current score from the context
  // We don't need to calculate it here as it's already managed by the UploadContext
  const totalScore = currentScore;

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
    if (!scoredItems.has(item.id)) {
      addToScore(Math.ceil(item.score / 2)); // Increment by half the item's score, rounded up
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

  // Group items into rows
  const rows: PantryItemProps[][] = [];
  for (let i = 0; i < pantryItems.length; i += ROW_ITEMS) {
    const row = pantryItems
      .slice(i, i + ROW_ITEMS)
      .map((item, idx) => {
        const itemId = `item-${i + idx}`;
        const isDisabled = disabledItems.has(itemId);
        return {
          ...item,
          id: itemId,
          disabled: isDisabled,
          isUploadPage: isUploadPage,
          onClick: (e: React.MouseEvent) =>
            handleItemClick(
              {
                ...item,
                id: itemId,
                disabled: isDisabled,
              },
              e
            ),
        };
      });
    rows.push(row);
  }

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
      <div className="mb-6">
        <input
          placeholder="Search Pantry..."
          className="w-full rounded-full border border-amber-900 bg-amber-50/10 text-amber-50 px-4 py-2 outline-none focus:ring-2 focus:ring-amber-500/50 placeholder-amber-100/50"
        />
      </div>
      <div className="relative">
        <div className="h-1 bg-[#793c1a] rounded-t-lg mb-2"></div>

        <div className="bg-amber-50/5 backdrop-blur-sm rounded-lg p-4">
          <div className="px-4 py-2 font-semibold text-amber-50 text-lg">
            Pantry
          </div>

          <div className="space-y-6">
        {rows.map((row, index) => (
          <PantryRow
            key={index}
            items={row}
            rowIndex={index}
          />
        ))}
      </div>

          {/* Potential Score */}
          <div className="mt-8 pt-4 border-t border-amber-900/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-amber-100 font-medium">Current Score:</span>
              <span className="text-amber-50 text-xl font-bold">
                {totalScore}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-amber-100 font-medium">
                Pantry Items: {pantryItems.length}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom ledge */}
        <div className="h-3 bg-[#793c1a] rounded-b-lg mt-2"></div>
      </div>
    </aside>
  );
}