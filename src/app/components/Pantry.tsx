"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUpload } from "../context/UploadContext";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Image from "next/image";

interface PantryItem {
  name: string;
  image: string;
  score: number;
}

interface FoodItem extends PantryItem {
  id: string;
  disabled?: boolean;
  emoji?: string;
  color?: string;
}

const PANTRY_ITEMS: PantryItem[] = [
  { name: "Lobster", image: "/food_lobster.png", score: 7 },
  { name: "Rice", image: "/food_rice.png", score: 3 },
  { name: "Bok Choy", image: "/food_bok_choy.png", score: 3 },
  { name: "Steak", image: "/food_steak.png", score: 5 },
  { name: "Carrot", image: "/food_carrot.png", score: 3 },
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
  onClick: (e: React.MouseEvent) => void;
  disabled: boolean;
}

function PantryItem({
  id,
  name,
  image,
  score,
  onClick,
  disabled,
}: PantryItemProps) {
  return (
    <div
      className={`rounded-lg p-4 flex flex-col items-center justify-center transition-all ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:opacity-90 hover:scale-105"
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
        <div className="absolute -left-[5px] top-[20px] bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
          +{score}
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
              onClick={() => {}} // Remove the redundant onClick handler
              disabled={item.disabled || false}
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

export default function Pantry() {
  const { score: currentScore, addToScore } = useUpload();
  const [flyingFoods, setFlyingFoods] = useState<FlyingFood[]>([]);
  const [disabledItems, setDisabledItems] = useState<Set<string>>(new Set());
  const [pantryItems, setPantryItems] = useState<PantryItem[]>(PANTRY_ITEMS);
  const pantryRef = useRef<HTMLDivElement>(null);

  // Calculate total score based on current score and disabled items
  const totalScore = currentScore + pantryItems.reduce((sum, item, index) => {
    return sum + (disabledItems.has(`item-${index}`) ? item.score : 0);
  }, 0);

  const emojiMap: Record<string, string> = {
    Lobster: "🦞",
    Rice: "🍚",
    "Bok Choy": "🥬",
    Steak: "🥩",
    Carrot: "🥕",
    Milk: "🥛",
  };

  const handleItemClick = (item: FoodItem, e: React.MouseEvent) => {
    if (!pantryRef.current) return;

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

    // Add to score and disable the item
    addToScore(item.score);
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
        return {
          ...item,
          id: itemId,
          disabled: disabledItems.has(itemId),
          onClick: (e: React.MouseEvent) =>
            handleItemClick(
              {
                ...item,
                id: itemId,
                disabled: disabledItems.has(itemId),
              },
              e
            ),
        };
      });
    rows.push(row);
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
