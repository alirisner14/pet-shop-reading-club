// src/components/host/HostAnimation.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { HostChoice } from '@/types';

// Plays the frame-by-frame celebration sequence — Maya jumps, Alex dances.
// Six frames each, cycled on a timer.

const SEQUENCES: Record<HostChoice, { prefix: string; frames: number }> = {
  maya: { prefix: '/images/hosts/maya/Maya_Jump_Frame_', frames: 6 },
  alex: { prefix: '/images/hosts/alex/Alex_Dance_Frame_', frames: 6 },
};

type Props = {
  host: HostChoice;
  /** Milliseconds per frame. Lower is faster. */
  frameMs?: number;
  /** How many times to run through. 0 loops forever. */
  loops?: number;
  onDone?: () => void;
  className?: string;
};

export default function HostAnimation({
  host,
  frameMs = 110,
  loops = 3,
  onDone,
  className = '',
}: Props) {
  const { prefix, frames } = SEQUENCES[host];
  const [frame, setFrame] = useState(1);

  useEffect(() => {
    let count = 0;
    let current = 1;

    const id = setInterval(() => {
      current = current === frames ? 1 : current + 1;
      setFrame(current);

      if (current === 1) {
        count++;
        if (loops > 0 && count >= loops) {
          clearInterval(id);
          onDone?.();
        }
      }
    }, frameMs);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host, frameMs, loops]);

  return (
    <div className={`relative ${className}`} style={{ aspectRatio: '3 / 5' }}>
      {/* All frames are rendered but only one is shown, so the browser
          has them decoded ahead of time and the loop stays smooth. */}
      {Array.from({ length: frames }, (_, i) => i + 1).map((n) => (
        <Image
          key={n}
          src={`${prefix}${n}.webp`}
          alt=""
          fill
          sizes="(max-width: 768px) 45vw, 30vw"
          priority={n === 1}
          className={`object-contain object-bottom ${
            n === frame ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
    </div>
  );
}
