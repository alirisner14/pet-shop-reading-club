// src/components/game/PetSprite.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { petOpen, petClosed, type Pet } from '@/data/pets';

// A pet that blinks.
//
// Two images and a timer. It's a small thing, but a character whose
// eyes never move reads as a sticker, and one that blinks reads as
// alive — which matters when she's meant to care about it.
//
// Blinks land at random intervals, occasionally doubling up, because
// anything on a fixed beat starts to look mechanical.

const MIN_GAP = 2600;
const MAX_GAP = 6500;
const BLINK_MS = 130;

export default function PetSprite({
  pet,
  className = '',
  priority = false,
  sizes = '30vw',
  /** Set false for a still image — the carousel, say. */
  blink = true,
}: {
  pet: Pet;
  className?: string;
  priority?: boolean;
  sizes?: string;
  blink?: boolean;
}) {
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!blink) return;

    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const shut = (thenAgain: boolean) => {
      if (cancelled) return;
      setClosed(true);

      timer = setTimeout(() => {
        if (cancelled) return;
        setClosed(false);

        // Every so often, a quick second blink.
        if (thenAgain) timer = setTimeout(() => shut(false), 180);
        else schedule();
      }, BLINK_MS);
    };

    const schedule = () => {
      const gap = MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP);
      timer = setTimeout(() => shut(Math.random() < 0.25), gap);
    };

    schedule();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pet.key, blink]);

  return (
    <div className={`relative ${className}`}>
      {/* Both frames stay mounted so the swap is instant — loading the
          closed-eye image at blink time would show a gap. */}
      <Image
        src={petOpen(pet)}
        alt={pet.label}
        fill
        sizes={sizes}
        priority={priority}
        className="object-contain"
        style={{ opacity: closed ? 0 : 1 }}
      />
      <Image
        src={petClosed(pet)}
        alt=""
        fill
        sizes={sizes}
        aria-hidden
        className="object-contain"
        style={{ opacity: closed ? 1 : 0 }}
      />
    </div>
  );
}
