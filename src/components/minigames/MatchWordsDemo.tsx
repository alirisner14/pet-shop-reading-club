// src/components/minigames/MatchWordsDemo.tsx
'use client';

import { useEffect, useState } from 'react';
import Confetti from '@/components/game/Confetti';
import type { HostChoice } from '@/types';

// A silent, looping demonstration of Match the Words, shown behind the
// host while she explains the rules. Watching it once is worth more than
// the explanation itself to a child who can't read the instructions.
//
// Nothing here is interactive — it's a canned performance on a timer.

const DEMO_WORDS = ['cat', 'dog', 'red'];

const THEME = {
  maya: {
    tile: 'rgba(255, 227, 238, 0.62)',
    words: ['#52CBFF', '#FFC29B', '#DB5CFF'],
    yarn: '#F49AC1',
  },
  alex: {
    tile: 'rgba(136, 149, 249, 0.50)',
    words: ['#FFF731', '#7DF376', '#D80041'],
    yarn: '#8895F9',
  },
} as const;

// Right column order — deliberately jumbled.
const RIGHT = [2, 0, 1];

type Stage = 'idle' | 'dragging' | 'matched';

export default function MatchWordsDemo({ host }: { host: HostChoice }) {
  const theme = THEME[host];
  const [stage, setStage] = useState<Stage>('idle');
  const [progress, setProgress] = useState(0); // 0..1 along the strand

  // One loop: pause, drag across, pop, reset.
  useEffect(() => {
    let raf = 0;
    let start = 0;

    const timers: ReturnType<typeof setTimeout>[] = [];

    function runLoop() {
      setStage('idle');
      setProgress(0);

      timers.push(
        setTimeout(() => {
          setStage('dragging');
          start = performance.now();

          const step = (now: number) => {
            const t = Math.min(1, (now - start) / 1400);
            setProgress(t);
            if (t < 1) raf = requestAnimationFrame(step);
            else {
              setStage('matched');
              timers.push(setTimeout(runLoop, 1800));
            }
          };
          raf = requestAnimationFrame(step);
        }, 900)
      );
    }

    runLoop();

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, []);

  // Anchor points, in percentages of the box. Row 0 on the left connects
  // to slot 1 on the right, since RIGHT[1] === 0.
  const from = { x: 42, y: 26 };
  const to = { x: 58, y: 50 };

  const tip = {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress,
  };

  const midX = (from.x + tip.x) / 2;
  const midY = (from.y + tip.y) / 2 + Math.abs(tip.x - from.x) * 0.5;
  const d = `M ${from.x} ${from.y} Q ${midX} ${midY} ${tip.x} ${tip.y}`;

  function Tile({ word, i, done }: { word: string; i: number; done: boolean }) {
    return (
      <div
        className="w-full rounded-[1.6rem] border-4 px-6 py-1 backdrop-blur-md transition-all duration-500"
        style={{
          background: theme.tile,
          borderColor: 'rgba(255,255,255,0.9)',
          boxShadow:
            'inset 0 3px 8px rgba(255,255,255,0.85), inset 0 -4px 10px rgba(0,0,0,0.10), 0 8px 18px rgba(0,0,0,0.18)',
          opacity: done ? 0 : 1,
          transform: done ? 'scale(0.5)' : 'scale(1)',
        }}
      >
        <span
          className="font-display text-engraved text-7xl"
          style={{ color: theme.words[i % theme.words.length] }}
        >
          {word}
        </span>
      </div>
    );
  }

  const pairDone = stage === 'matched';

  return (
    <div className="relative h-full w-full px-6 py-4">
      {/* Yarn */}
      <svg
        className="pointer-events-none absolute inset-0 z-20 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {stage === 'dragging' && (
          <>
            <path
              d={d}
              stroke="rgba(0,0,0,0.18)"
              strokeWidth={2.2}
              strokeLinecap="round"
              fill="none"
              transform="translate(0,0.6)"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={d}
              stroke={theme.yarn}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}
      </svg>

      {pairDone && (
        <>
          <Confetti x={0} y={0} pieces={10} spread={110} />
        </>
      )}

      <div className="flex h-full w-full max-w-5xl items-center justify-between gap-28">
        <div className="flex flex-1 flex-col gap-14">
          {DEMO_WORDS.map((w, i) => (
            <Tile key={`dl-${w}`} word={w} i={i} done={pairDone && i === 0} />
          ))}
        </div>

        <div className="flex flex-1 flex-col gap-14">
          {RIGHT.map((wordIndex, slot) => (
            <Tile
              key={`dr-${slot}`}
              word={DEMO_WORDS[wordIndex]}
              i={wordIndex}
              done={pairDone && wordIndex === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
