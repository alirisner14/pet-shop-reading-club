// src/components/game/RewardPicker.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Confetti from '@/components/game/Confetti';
import type { Reward } from '@/data/rewards';
import type { HostChoice } from '@/types';

// "Pick a present" — three options, one choice.
//
// Three rather than everything at once: a wall of options is paralysing
// at five, and a small choice she actually makes is worth more than a
// big one she picks at random.

export default function RewardPicker({
  host,
  rewards,
  onChoose,
}: {
  host: HostChoice;
  rewards: Reward[];
  onChoose: (rewardKey: string) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);

  const accent = host === 'maya' ? '#F49AC1' : '#8895F9';
  const tile =
    host === 'maya' ? 'rgba(255, 227, 238, 0.62)' : 'rgba(136, 149, 249, 0.50)';

  function choose(key: string) {
    if (picked) return;
    setPicked(key);
    setTimeout(() => onChoose(key), 1100);
  }

  return (
    <div className="absolute inset-0 z-40 bg-black/35">
      <div className="pointer-events-none absolute inset-x-[7%] inset-y-[7%] rounded-[2.5rem] border-[6px] border-white bg-white/30 shadow-2xl backdrop-blur-[3px]" />

      <div className="absolute inset-x-[7%] inset-y-[7%] flex flex-col items-center justify-between py-8">
        <h2
          className="font-display text-7xl text-white"
          style={{
            WebkitTextStroke: `5px ${accent}`,
            paintOrder: 'stroke fill',
            filter: 'drop-shadow(0 5px 8px rgba(0,0,0,0.3))',
          }}
        >
          Pick a present!
        </h2>

        <div className="flex flex-1 items-center justify-center gap-10 px-6">
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
                  background: tile,
                  borderColor: 'rgba(255,255,255,0.9)',
                  animationDelay: `${i * 140}ms`,
                  boxShadow:
                    'inset 0 4px 10px rgba(255,255,255,0.85), inset 0 -5px 12px rgba(0,0,0,0.10), 0 10px 22px rgba(0,0,0,0.22)',
                  opacity: dimmed ? 0.25 : 1,
                  transform: chosen ? 'scale(1.12)' : undefined,
                }}
                className={`
                  animate-tile relative h-[300px] w-[300px] rounded-[2rem] border-[6px]
                  p-6 backdrop-blur-md transition-all duration-500
                  ${!picked ? 'hover-hop' : ''}
                  ${chosen ? 'animate-cheer' : ''}
                `}
              >
                <div className="relative h-full w-full">
                  <Image
                    src={reward.image}
                    alt=""
                    fill
                    sizes="300px"
                    className="object-contain"
                    style={{
                      filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.25))',
                    }}
                  />
                </div>

                {chosen && <Confetti x="50%" y="45%" pieces={20} spread={240} />}
              </button>
            );
          })}
        </div>

        <p className="font-game text-3xl text-white drop-shadow-lg">
          Tap the one you want
        </p>
      </div>
    </div>
  );
}
