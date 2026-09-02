// src/components/game/RewardPicker.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Confetti from '@/components/game/Confetti';
import PetSprite from '@/components/game/PetSprite';
import type { Reward } from '@/data/rewards';
import type { Pet } from '@/data/pets';
import type { HostChoice } from '@/types';

// "Pick a present" — a drawer that slides up from the bottom while the
// pet sits above it, waiting.
//
// Three options rather than everything at once: a wall of choices is
// paralysing at five, and a small choice she actually makes is worth
// more than a big one she picks at random.

export default function RewardPicker({
  host,
  pet,
  petName,
  rewards,
  onChoose,
}: {
  host: HostChoice;
  pet: Pet | null;
  petName?: string | null;
  rewards: Reward[];
  onChoose: (rewardKey: string) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Slide in a beat after mounting, so the movement is visible.
  useEffect(() => {
    const id = setTimeout(() => setOpen(true), 260);
    return () => clearTimeout(id);
  }, []);

  const accent = host === 'maya' ? '#F49AC1' : '#8895F9';
  const glass =
    host === 'maya' ? 'rgba(255, 227, 238, 0.42)' : 'rgba(136, 149, 249, 0.34)';

  function choose(key: string) {
    if (picked) return;
    setPicked(key);
    setTimeout(() => onChoose(key), 1100);
  }

  return (
    <div className="absolute inset-0 z-40 bg-black/35">
      <div className="absolute inset-x-0 top-[6%] text-center">
        <h2
          className="font-display text-6xl text-white"
          style={{
            WebkitTextStroke: `5px ${accent}`,
            paintOrder: 'stroke fill',
            filter: 'drop-shadow(0 5px 8px rgba(0,0,0,0.3))',
          }}
        >
          Pick a present{petName ? ` for ${petName}` : ''}!
        </h2>
      </div>

      {/* The pet, standing just above the drawer */}
      {pet && (
        <div className="absolute bottom-[36%] left-1/2 h-[30%] w-[26%] -translate-x-1/2">
          <PetSprite pet={pet} sizes="30vw" className="h-full w-full" />
        </div>
      )}

      {/* The drawer. Its top edge lands just under the pet's feet. */}
      <div
        className="absolute inset-x-0 bottom-0 transition-transform duration-700 ease-out"
        style={{
          height: '36%',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        <div
          className="relative h-full rounded-t-[2.5rem]"
          style={{
            background: glass,
            backdropFilter: 'blur(10px)',
            borderTop: `8px solid ${accent}`,
            borderLeft: `8px solid ${accent}`,
            borderRight: `8px solid ${accent}`,
            boxShadow:
              'inset 0 6px 14px rgba(255,255,255,0.75), inset 0 -6px 16px rgba(0,0,0,0.12), 0 -12px 30px rgba(0,0,0,0.3)',
          }}
        >
          {/* A little handle, so it reads as a drawer */}
          <div
            className="absolute left-1/2 top-3 h-2 w-24 -translate-x-1/2 rounded-full"
            style={{ background: 'rgba(255,255,255,0.8)' }}
          />

          <div className="flex h-full items-center justify-center gap-8 px-8 pt-5">
            {rewards.map((reward, i) => {
              const chosen = picked === reward.key;
              const dimmed = picked && !chosen;

              return (
                <button
                  key={reward.key}
                  onClick={() => choose(reward.key)}
                  disabled={!!picked}
                  aria-label={reward.label}
                  style={{
                    background: 'rgba(255,255,255,0.55)',
                    borderColor: 'rgba(255,255,255,0.95)',
                    animationDelay: `${i * 140}ms`,
                    boxShadow:
                      'inset 0 4px 10px rgba(255,255,255,0.9), inset 0 -5px 12px rgba(0,0,0,0.08), 0 8px 18px rgba(0,0,0,0.2)',
                    opacity: dimmed ? 0.25 : 1,
                    transform: chosen ? 'scale(1.12)' : undefined,
                  }}
                  className={`
                    animate-tile relative h-[82%] w-[22%] rounded-[1.75rem]
                    border-[6px] p-4 transition-all duration-500
                    ${!picked ? 'hover-hop' : ''}
                    ${chosen ? 'animate-cheer' : ''}
                  `}
                >
                  <div className="relative h-full w-full">
                    <Image
                      src={reward.image}
                      alt=""
                      fill
                      sizes="22vw"
                      className="object-contain"
                      style={{
                        filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.22))',
                      }}
                    />
                  </div>

                  {chosen && <Confetti x="50%" y="45%" pieces={20} spread={240} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
