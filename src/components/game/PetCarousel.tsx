// src/components/game/PetCarousel.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import ArrowButton from '@/components/ui/ArrowButton';
import { PETS } from '@/data/pets';
import type { HostChoice } from '@/types';

// "Choose Your Pet" — one pet at a time, arrows to browse.
//
// A grid of eight would be faster, but this is the moment the whole
// meter has been building toward. Making her look at each one in turn
// is the point: it turns picking into choosing.

export default function PetCarousel({
  host,
  onChoose,
}: {
  host: HostChoice;
  onChoose: (petKey: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const pet = PETS[index];

  function move(delta: number) {
    setIndex((index + delta + PETS.length) % PETS.length);
  }

  const accent = host === 'maya' ? '#F49AC1' : '#8895F9';

  return (
    <div className="absolute inset-0 z-40">
      {/* Frosted panel, same as the play area */}
      <div className="pointer-events-none absolute inset-x-[7%] inset-y-[7%] rounded-[2.5rem] border-[6px] border-white bg-white/30 shadow-2xl backdrop-blur-[3px]" />

      <div className="absolute inset-x-[7%] inset-y-[7%] flex flex-col items-center justify-between py-6">
        <h2
          className="font-display text-7xl text-white"
          style={{
            WebkitTextStroke: `5px ${accent}`,
            paintOrder: 'stroke fill',
            filter: 'drop-shadow(0 5px 8px rgba(0,0,0,0.3))',
          }}
        >
          Choose Your Pet
        </h2>

        {/* The pet, with arrows either side */}
        <div className="flex w-full flex-1 items-center justify-between px-8">
          <ArrowButton
            direction="left"
            onClick={() => move(-1)}
            label="Previous pet"
            size={110}
          />

          <div className="relative h-full flex-1">
            <Image
              key={pet.key}
              src={pet.image}
              alt={pet.label}
              fill
              sizes="50vw"
              priority
              className="animate-pop-in object-contain"
              style={{ filter: 'drop-shadow(0 12px 18px rgba(0,0,0,0.28))' }}
            />
          </div>

          <ArrowButton
            direction="right"
            onClick={() => move(1)}
            label="Next pet"
            size={110}
          />
        </div>

        {/* Which one of eight */}
        <div className="mb-3 flex gap-3">
          {PETS.map((p, i) => (
            <span
              key={p.key}
              className="block h-4 w-4 rounded-full border-2 border-white transition-all"
              style={{
                background: i === index ? accent : 'rgba(255,255,255,0.45)',
                transform: i === index ? 'scale(1.35)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        <button
          onClick={() => onChoose(pet.key)}
          className="font-display hover-hop rounded-full border-[6px] border-white px-20 py-6 text-5xl text-white shadow-2xl transition-transform active:scale-95"
          style={{
            background: accent,
            boxShadow:
              'inset 0 4px 10px rgba(255,255,255,0.5), inset 0 -5px 12px rgba(0,0,0,0.14), 0 12px 26px rgba(0,0,0,0.28)',
          }}
        >
          This one!
        </button>
      </div>
    </div>
  );
}
