// src/components/game/PetNaming.tsx
'use client';

import { useState } from 'react';
import PetSprite from '@/components/game/PetSprite';
import type { Pet } from '@/data/pets';
import type { HostChoice } from '@/types';

// Naming the pet.
//
// A five-year-old learning to read can't reliably spell a name, and a
// blank text box is a wall. So the names are offered as buttons she can
// tap — with a text field underneath for a grown-up, or for a child who
// wants to type her own.

const KITTEN_NAMES = [
  'Mittens', 'Luna', 'Biscuit', 'Pip', 'Clover', 'Peaches',
  'Marshmallow', 'Nutmeg', 'Bubbles', 'Ziggy', 'Poppy', 'Waffles',
];

const PUPPY_NAMES = [
  'Buddy', 'Daisy', 'Cocoa', 'Scout', 'Pumpkin', 'Rusty',
  'Noodle', 'Bailey', 'Pepper', 'Mango', 'Tinker', 'Biscuit',
];

export default function PetNaming({
  pet,
  host,
  onName,
}: {
  pet: Pet;
  host: HostChoice;
  onName: (name: string) => void;
}) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [typed, setTyped] = useState('');

  const accent = host === 'maya' ? '#F49AC1' : '#8895F9';
  const names = pet.kind === 'kitten' ? KITTEN_NAMES : PUPPY_NAMES;

  const name = typed.trim() || chosen || '';

  return (
    <div className="absolute inset-0 z-40 bg-black/40">
      <div className="absolute inset-x-[6%] inset-y-[5%] flex flex-col items-center gap-4 rounded-[2.5rem] border-[6px] border-white bg-white/35 p-6 shadow-2xl backdrop-blur-md">
        <h2
          className="font-display text-6xl text-white"
          style={{
            WebkitTextStroke: `5px ${accent}`,
            paintOrder: 'stroke fill',
            filter: 'drop-shadow(0 5px 8px rgba(0,0,0,0.3))',
          }}
        >
          What&apos;s their name?
        </h2>

        <div className="flex w-full flex-1 items-center gap-6">
          {/* The pet, waiting to be named */}
          <div className="h-full w-[28%] shrink-0">
            <PetSprite
              pet={pet}
              priority
              sizes="30vw"
              className="h-full w-full"
            />
          </div>

          {/* Name choices */}
          <div className="flex flex-1 flex-wrap content-center justify-center gap-3">
            {names.map((n) => {
              const active = chosen === n && !typed.trim();
              return (
                <button
                  key={n}
                  onClick={() => {
                    setChosen(n);
                    setTyped('');
                  }}
                  className="font-game rounded-2xl border-4 px-6 py-2 text-3xl shadow-lg transition-transform active:scale-95"
                  style={{
                    background: active ? accent : 'rgba(255,255,255,0.9)',
                    color: active ? '#ffffff' : '#5B4A66',
                    borderColor: 'rgba(255,255,255,0.9)',
                    transform: active ? 'scale(1.06)' : undefined,
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        {/* Or type one */}
        <div className="flex w-full items-center justify-center gap-4">
          <input
            value={typed}
            maxLength={16}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="or type a name"
            className="font-game w-72 rounded-2xl border-4 border-white bg-white/90 px-5 py-3 text-center text-2xl outline-none"
          />

          <button
            onClick={() => name && onName(name)}
            disabled={!name}
            className="font-display rounded-full border-[6px] border-white px-14 py-5 text-4xl text-white shadow-2xl transition-transform active:scale-95 disabled:opacity-30"
            style={{
              background: accent,
              boxShadow:
                'inset 0 4px 10px rgba(255,255,255,0.5), inset 0 -5px 12px rgba(0,0,0,0.14), 0 10px 22px rgba(0,0,0,0.25)',
            }}
          >
            That&apos;s the one!
          </button>
        </div>
      </div>
    </div>
  );
}
