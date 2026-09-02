// src/components/host/HostReaction.tsx
'use client';

import { useEffect, useState } from 'react';
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
  /** null slides her back off the left edge. */
  reaction: Reaction | null;
}) {
  // The pose is held after `reaction` clears, so she keeps her
  // expression on the way out instead of snapping to neutral.
  const [pose, setPose] = useState<Reaction>('excited');

  useEffect(() => {
    if (reaction) setPose(reaction);
  }, [reaction]);

  const shown = reaction !== null;

  return (
    <div
      className={`pointer-events-none absolute bottom-0 left-0 z-30 h-[128%] w-[68%] transition-transform duration-500 ease-out ${
        shown
          ? 'translate-x-0 translate-y-[22%]'
          : '-translate-x-[70%] translate-y-[30%]'
      }`}
    >
      <Image
        src={IMAGES[host][pose]}
        alt=""
        fill
        sizes="(max-width: 768px) 80vw, 68vw"
        className="object-contain drop-shadow-2xl"
        style={{ objectPosition: 'left bottom' }}
      />
    </div>
  );
}
