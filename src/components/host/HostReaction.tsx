// src/components/host/HostReaction.tsx
'use client';

import Image from 'next/image';
import type { HostChoice } from '@/types';

// A quick visual "nice one" — the host rises from the bottom-left for a
// moment, then goes. Deliberately occasional: on every answer it would
// just be noise.

export type Reaction = 'excited' | 'thumbsup';

const IMAGES: Record<HostChoice, Record<Reaction, string>> = {
  maya: {
    excited: '/images/hosts/maya/Maya_Excited.webp',
    thumbsup: '/images/hosts/maya/Maya_ThumbsUp.webp',
  },
  alex: {
    excited: '/images/hosts/alex/Alex_Excited.webp',
    thumbsup: '/images/hosts/alex/Alex_ThumbsUp.webp',
  },
};

export default function HostReaction({
  host,
  reaction,
}: {
  host: HostChoice;
  reaction: Reaction;
}) {
  return (
    <div className="animate-rise-up pointer-events-none absolute bottom-0 left-[1%] z-30 h-[62%]">
      <div className="relative h-full" style={{ aspectRatio: '3 / 5' }}>
        <Image
          src={IMAGES[host][reaction]}
          alt=""
          fill
          sizes="(max-width: 768px) 50vw, 40vw"
          className="object-contain object-bottom drop-shadow-2xl"
        />
      </div>
    </div>
  );
}
