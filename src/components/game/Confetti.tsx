// src/components/game/Confetti.tsx
'use client';

import { useMemo } from 'react';

// A burst of paper. No library — just a handful of divs, each given its
// own direction, spin and duration, thrown outward by a CSS animation.

type Props = {
  /** Where the burst starts, relative to the parent box. Numbers are
   *  pixels; strings pass straight through, so '25%' works too. */
  x: number | string;
  y: number | string;
  colors?: string[];
  pieces?: number;
  /** How far the pieces travel. */
  spread?: number;
};

const DEFAULT_COLORS = [
  '#F49AC1',
  '#52CBFF',
  '#FFC29B',
  '#DB5CFF',
  '#7DF376',
  '#FFF731',
];

export default function Confetti({
  x,
  y,
  colors = DEFAULT_COLORS,
  pieces = 16,
  spread = 160,
}: Props) {
  // Random values are generated once, so the burst doesn't reshuffle
  // partway through its animation.
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => {
        const angle = (Math.PI * 2 * i) / pieces + Math.random() * 0.5;
        const distance = spread * (0.55 + Math.random() * 0.65);
        return {
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance - 40, // bias upward, like real confetti
          rot: Math.round(Math.random() * 720 - 360),
          dur: 0.8 + Math.random() * 0.5,
          color: colors[i % colors.length],
          round: Math.random() > 0.5,
        };
      }),
    [pieces, spread, colors]
  );

  return (
    <div
      className="pointer-events-none absolute z-40"
      style={{ left: x, top: y }}
      aria-hidden
    >
      {bits.map((b, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              background: b.color,
              borderRadius: b.round ? '50%' : '3px',
              '--dx': `${b.dx}px`,
              '--dy': `${b.dy}px`,
              '--rot': `${b.rot}deg`,
              '--dur': `${b.dur}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
