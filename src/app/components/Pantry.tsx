'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const PANTRY_ITEMS = [
  { name: "Lobster", image: "/food_lobster.png", score: 7 },
  { name: "Rice", image: "/food_rice.png", score: 3 },
  { name: "Bok Choy", image: "/food_bok_choy.png", score: 3 },
  { name: "Steak", image: "/food_steak.png", score: 5 },
  { name: "Carrot", image: "/food_carrot.png", score: 3 },
  { name: "Milk", image: "/food_milk.png", score: 2 }
];

const ROW_ITEMS = 3;
const firstRowItems = PANTRY_ITEMS.slice(0, Math.ceil(PANTRY_ITEMS.length / 2));
const secondRowItems = PANTRY_ITEMS.slice(Math.ceil(PANTRY_ITEMS.length / 2));

function PantryRow({ items, rowIndex }: { items: typeof PANTRY_ITEMS, rowIndex: number }) {
  const [position, setPosition] = useState(0);
  const maxPosition = Math.max(0, items.length - ROW_ITEMS);

  const moveLeft = () => {
    setPosition(prev => Math.max(0, prev - 1));
  };

  const moveRight = () => {
    setPosition(prev => Math.min(maxPosition, prev + 1));
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
          <ArrowBackIosNewIcon style={{ fontSize: 14 }} />
        </button>
      )}
      <div className="grid grid-cols-3 gap-4 relative">
        {visibleItems.map((item, index) => (
          <motion.div 
            key={`${rowIndex}-${item.name}`}
            className="flex flex-col items-center p-3 rounded-lg cursor-pointer group"
            whileHover={{ 
              scale: 1.1,
              rotate: [0, -2, 2, -2, 2, 0],
              transition: { 
                scale: { duration: 0.2 },
                rotate: { duration: 0.5 }
              }
            }}
          >
            <div className="w-16 h-16 mb-2 flex items-center justify-center relative">
              <Image 
                src={item.image}
                alt={item.name}
                width={64}
                height={64}
                style={{ objectFit: 'contain' }}
                className="group-hover:drop-shadow-lg transition-all duration-300"
                priority
              />
            </div>
            <div className="text-sm font-medium text-amber-50 text-center">{item.name}</div>
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
  return (
    <aside className="sticky top-0 h-screen hidden lg:block p-4 bg-[#3f1203] overflow-y-auto w-80">
      <div className="mb-6">
        <input
          placeholder="Search Pantry..."
          className="w-full rounded-full border border-amber-900 bg-amber-50/10 text-amber-50 px-4 py-2 outline-none focus:ring-2 focus:ring-amber-500/50 placeholder-amber-100/50"
        />
      </div>
      <div className="relative">
        {/* Top ledge */}
        <div className="h-1 bg-[#793c1a] rounded-t-lg mb-2"></div>
        
        <div className="bg-amber-50/5 backdrop-blur-sm rounded-lg p-4">
          <div className="px-4 py-2 font-semibold text-amber-50 text-lg">Pantry</div>
          
          {/* First Row */}
          <div className="mb-6">
            <PantryRow items={firstRowItems} rowIndex={0} />
          </div>
          
          {/* Divider */}
          <div className="h-px bg-amber-900/50 my-4"></div>
          
          {/* Second Row */}
          <div className="mt-6">
            <PantryRow items={secondRowItems} rowIndex={1} />
          </div>
        </div>
        
        {/* Bottom ledge */}
        <div className="h-3 bg-[#793c1a] rounded-b-lg mt-2"></div>
      </div>
    </aside>
  );
}
