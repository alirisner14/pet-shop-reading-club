// src/components/game/PetWithCollar.tsx
'use client';

import { forwardRef } from 'react';
import Image from 'next/image';
import PetSprite from '@/components/game/PetSprite';
import { COLLAR_PET_RATIO } from '@/data/rewards';
import type { Pet } from '@/data/pets';

// A pet, plus the collar she put on it.
//
// The box is always square, and the collar is positioned as a percentage
// of that box. That's what keeps it on the neck wherever the pet is
// shown — big in the room, small in the corner of a game.

export type WornCollar = {
  image: string;
  label: string;
  /** Percent across the pet. */
  x: number;
  /** Percent down the pet. */
  y: number;
};

type Props = {
  pet: Pet;
  collar?: WornCollar | null;
  /** Width is set by the caller, e.g. "w-[18%]". The box stays square. */
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Lets the room pick the collar up again. Omit to leave it fixed. */
  onCollarPointerDown?: (e: React.PointerEvent) => void;
};

const PetWithCollar = forwardRef<HTMLDivElement, Props>(function PetWithCollar(
  { pet, collar, className = '', sizes, priority, onCollarPointerDown },
  ref
) {
  return (
    <div ref={ref} className={`relative aspect-square ${className}`}>
      <PetSprite
        pet={pet}
        sizes={sizes}
        priority={priority}
        className="h-full w-full"
      />

      {collar && (
        <button
          type="button"
          aria-label={collar.label}
          onPointerDown={onCollarPointerDown}
          tabIndex={onCollarPointerDown ? 0 : -1}
          className="absolute"
          style={{
            left: `${collar.x}%`,
            top: `${collar.y}%`,
            width: `${COLLAR_PET_RATIO * 100}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: onCollarPointerDown ? 'auto' : 'none',
            touchAction: 'none',
            cursor: onCollarPointerDown ? 'grab' : undefined,
          }}
        >
          <Image
            src={collar.image}
            alt=""
            width={400}
            height={400}
            sizes="10vw"
            className="h-auto w-full object-contain"
            draggable={false}
          />
        </button>
      )}
    </div>
  );
});

export default PetWithCollar;
