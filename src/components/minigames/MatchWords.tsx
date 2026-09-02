// src/components/minigames/MatchWords.tsx
'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  playWord,
  playWordNow,
  playPraise,
  playCorrection,
} from '@/lib/audio';
import Confetti from '@/components/game/Confetti';
import { MAX_ATTEMPTS } from '@/lib/progression';
import type { Word } from '@/data/words';
import type { HostChoice } from '@/types';

// Match the Words
//
// Two columns of words. Drag yarn between a word and its twin, from
// either side.
//
// Guessing is deliberately made unprofitable:
//   - only the FIRST attempt on a pair earns credit
//   - a wrong answer reshuffles the unmatched tiles, so elimination
//     can't be memorised
//   - after two misses the game quietly draws the answer itself
//   - from level 3 the right column holds an extra word that matches
//     nothing, so the last tile standing isn't a free point
//
// The aim is that guessing is boring and getting it right is a party.

type Props = {
  /** Words that have a matching pair. */
  words: Word[];
  /** Extra right-column words that match nothing. */
  distractors?: Word[];
  host: HostChoice;
  /** `firstTry` is false once she has already missed this pair. */
  onAnswer: (word: string, correct: boolean, firstTry: boolean) => void;
  onRoundDone: () => void;
};

type Side = 'left' | 'right';
type Point = { x: number; y: number };
type Grab = { side: Side; slot: number };

const THEME = {
  maya: {
    tile: 'rgba(255, 227, 238, 0.62)',
    words: ['#52CBFF', '#FFC29B', '#DB5CFF'],
    yarn: ['#F49AC1', '#DB5CFF', '#52CBFF'],
  },
  alex: {
    tile: 'rgba(136, 149, 249, 0.50)',
    words: ['#FFF731', '#7DF376', '#D80041'],
    yarn: ['#8895F9', '#7DF376', '#FFF731'],
  },
} as const;

export default function MatchWords({
  words,
  distractors = [],
  host,
  onAnswer,
  onRoundDone,
}: Props) {
  const theme = THEME[host];

  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rightRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // The right column holds real words plus the unmatchable extras.
  // Indices below words.length are real; the rest are distractors.
  const [rightOrder, setRightOrder] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [bursting, setBursting] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<Record<number, number>>({});
  const [showing, setShowing] = useState<{ from: Point; to: Point } | null>(
    null
  );

  const [grab, setGrab] = useState<Grab | null>(null);
  const [pointer, setPointer] = useState<Point | null>(null);
  const [entered, setEntered] = useState(false);

  // React runs state updaters twice in development. Anything with a side
  // effect — like telling the parent the round is over — has to live
  // outside them, or it happens twice and the level jumps.
  const finished = useRef(false);

  const [leftPts, setLeftPts] = useState<Point[]>([]);
  const [rightPts, setRightPts] = useState<Point[]>([]);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>(
    []
  );

  const allRight = [...words, ...distractors];

  const shuffleRight = useCallback(() => {
    const order = allRight.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    setRightOrder(order);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, distractors]);

  // ---------------------------------------------------------
  // New round
  // ---------------------------------------------------------
  useEffect(() => {
    shuffleRight();
    setMatched(new Set());
    setBursting(new Set());
    setGrab(null);
    setPointer(null);
    setWrong(null);
    setAttempts({});
    setShowing(null);
    setBursts([]);

    finished.current = false;

    setEntered(false);
    const id = setTimeout(() => setEntered(true), 1400);
    return () => clearTimeout(id);
  }, [words, shuffleRight]);

  // Round over — checked here rather than inside the updater.
  useEffect(() => {
    if (finished.current) return;
    if (words.length === 0 || matched.size < words.length) return;

    finished.current = true;
    const id = setTimeout(onRoundDone, 700);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched, words.length]);

  // ---------------------------------------------------------
  // Measuring
  // ---------------------------------------------------------
  const measure = useCallback(() => {
    const box = containerRef.current?.getBoundingClientRect();
    if (!box) return;

    const anchor = (el: HTMLElement | null, side: Side): Point => {
      if (!el) return { x: 0, y: 0 };
      const r = el.getBoundingClientRect();
      return {
        x: (side === 'left' ? r.right : r.left) - box.left,
        y: r.top + r.height / 2 - box.top,
      };
    };

    setLeftPts(leftRefs.current.map((el) => anchor(el, 'left')));
    setRightPts(rightRefs.current.map((el) => anchor(el, 'right')));
  }, []);

  useLayoutEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure, rightOrder]);

  // ---------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------
  /** Index into `words` (left) or `allRight` (right). */
  const itemAt = (side: Side, slot: number) =>
    side === 'left' ? slot : rightOrder[slot];

  const textAt = (side: Side, slot: number) => {
    const i = itemAt(side, slot);
    return side === 'left' ? words[i]?.word : allRight[i]?.word;
  };

  const anchorFor = (side: Side, slot: number) =>
    side === 'left' ? leftPts[slot] : rightPts[slot];

  function toLocal(e: React.PointerEvent): Point {
    const box = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  }

  // ---------------------------------------------------------
  // Dragging
  // ---------------------------------------------------------
  function startDrag(side: Side, slot: number, e: React.PointerEvent) {
    const text = textAt(side, slot);
    if (!text) return;

    const leftIndex = words.findIndex((w) => w.word === text);
    if (leftIndex !== -1 && matched.has(leftIndex)) return;
    if (showing) return;

    measure();
    playWordNow(text);
    setGrab({ side, slot });
    setPointer(toLocal(e));
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function moveDrag(e: React.PointerEvent) {
    if (!grab) return;
    setPointer(toLocal(e));
  }

  async function endDrag(e: React.PointerEvent) {
    if (!grab) return;

    const from = grab;
    setGrab(null);
    setPointer(null);

    const targetSide: Side = from.side === 'left' ? 'right' : 'left';
    const refs = targetSide === 'left' ? leftRefs : rightRefs;
    const dropped = document.elementFromPoint(e.clientX, e.clientY);

    const slot = refs.current.findIndex(
      (el) => el && dropped && (el === dropped || el.contains(dropped))
    );
    if (slot === -1) return; // released over nothing — no penalty

    const fromText = textAt(from.side, from.slot);
    const toText = textAt(targetSide, slot);
    if (!fromText || !toText) return;

    // The pair is identified by its position in the left column.
    const pairIndex = words.findIndex((w) => w.word === fromText);
    if (pairIndex === -1) return; // dragged from a distractor — ignore

    const correct = fromText === toText;
    const tries = attempts[pairIndex] ?? 0;

    if (correct) {
      const a = anchorFor(from.side, from.slot);
      const b = anchorFor(targetSide, slot);
      celebrate(pairIndex, a, b, tries === 0);
      return;
    }

    // Wrong.
    const nextTries = tries + 1;
    setAttempts({ ...attempts, [pairIndex]: nextTries });
    setWrong(pairIndex);
    setTimeout(() => setWrong(null), 700);

    // Only the first attempt is reported as a real miss.
    if (tries === 0) onAnswer(fromText, false, true);
    playCorrection(host);

    if (nextTries >= MAX_ATTEMPTS) {
      revealAnswer(pairIndex);
    } else {
      // Reshuffle so the board she memorised is gone.
      setTimeout(shuffleRight, 750);
    }
  }

  /** A correct match: confetti, burst, tiles gone. */
  function celebrate(
    pairIndex: number,
    a: Point,
    b: Point,
    firstTry: boolean
  ) {
    const text = words[pairIndex].word;

    if (firstTry) {
      const id = Date.now();
      setBursts((prev) => [
        ...prev,
        { id, x: a.x, y: a.y },
        { id: id + 1, x: b.x, y: b.y },
      ]);
      setTimeout(() => {
        setBursts((prev) => prev.filter((c) => c.id !== id && c.id !== id + 1));
      }, 1400);
      playPraise(host);
    } else {
      // Worked out after a miss — quiet acknowledgement, no party.
      playWord(text);
    }

    onAnswer(text, true, firstTry);
    setBursting((prev) => new Set(prev).add(pairIndex));

    setTimeout(() => {
      setMatched((prev) => new Set(prev).add(pairIndex));
    }, 420);
  }

  /** After too many misses, draw the answer instead of leaving her stuck. */
  function revealAnswer(pairIndex: number) {
    const text = words[pairIndex].word;
    const slot = rightOrder.findIndex((i) => allRight[i]?.word === text);

    const a = leftPts[pairIndex];
    const b = rightPts[slot];
    if (!a || !b) return;

    setShowing({ from: a, to: b });
    playWord(text);

    setTimeout(() => {
      setShowing(null);
      celebrate(pairIndex, a, b, false);
    }, 1800);
  }

  // ---------------------------------------------------------
  // Yarn
  // ---------------------------------------------------------
  function path(a: Point, b: Point) {
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2 + Math.abs(b.x - a.x) * 0.14;
    return `M ${a.x} ${a.y} Q ${midX} ${midY} ${b.x} ${b.y}`;
  }

  function Strand({ d, color }: { d: string; color: string }) {
    return (
      <g>
        <path
          d={d}
          stroke="rgba(0,0,0,0.18)"
          strokeWidth={16}
          strokeLinecap="round"
          fill="none"
          transform="translate(0,4)"
        />
        <path
          d={d}
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={d}
          stroke="rgba(0,0,0,0.12)"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray="3 12"
          fill="none"
        />
        <path
          d={d}
          stroke="rgba(255,255,255,0.6)"
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
          transform="translate(0,-3)"
        />
      </g>
    );
  }

  // ---------------------------------------------------------
  // Tile
  // ---------------------------------------------------------
  function Tile({
    side,
    slot,
    innerRef,
  }: {
    side: Side;
    slot: number;
    innerRef: (el: HTMLButtonElement | null) => void;
  }) {
    const text = textAt(side, slot);
    if (!text) return null;

    const pairIndex = words.findIndex((w) => w.word === text);
    const gone = pairIndex !== -1 && matched.has(pairIndex);
    const isBursting = pairIndex !== -1 && bursting.has(pairIndex) && !gone;
    const isWrong = wrong === pairIndex;
    const held = grab?.side === side && grab?.slot === slot;
    const colorIndex = itemAt(side, slot);

    return (
      <button
        ref={innerRef}
        onPointerDown={(e) => startDrag(side, slot, e)}
        disabled={gone}
        style={{
          background: isWrong ? 'rgba(244,154,193,0.75)' : theme.tile,
          borderColor: 'rgba(255,255,255,0.9)',
          animationDelay: `${slot * 120}ms`,
          touchAction: 'none',
          boxShadow: gone
            ? 'none'
            : 'inset 0 3px 8px rgba(255,255,255,0.85), inset 0 -4px 10px rgba(0,0,0,0.10), 0 8px 18px rgba(0,0,0,0.18)',
          visibility: gone ? 'hidden' : 'visible',
        }}
        className={`
          w-full rounded-[1.6rem] border-4 px-6 py-1
          backdrop-blur-md transition-transform duration-200
          ${entered ? 'hover-hop' : 'animate-tile'}
          ${isBursting ? 'animate-burst' : ''}
          ${isWrong ? 'animate-shake' : ''}
          ${held ? 'scale-105' : ''}
        `}
      >
        <span
          className="font-display text-engraved text-7xl"
          style={{ color: theme.words[colorIndex % theme.words.length] }}
        >
          {text}
        </span>
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="relative flex h-full w-full flex-col items-center justify-center px-6 py-4"
      style={{ touchAction: 'none' }}
    >
      <p className="font-game absolute top-1 rounded-full bg-white/90 px-10 py-3 text-4xl text-grape shadow-lg">
        Drag the yarn to the matching word!
      </p>

      <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full">
        {grab && pointer && anchorFor(grab.side, grab.slot) && (
          <Strand
            d={path(anchorFor(grab.side, grab.slot), pointer)}
            color={theme.yarn[itemAt(grab.side, grab.slot) % theme.yarn.length]}
          />
        )}

        {/* The game showing her the answer */}
        {showing && (
          <Strand d={path(showing.from, showing.to)} color={theme.yarn[0]} />
        )}
      </svg>

      {bursts.map((b) => (
        <Confetti key={b.id} x={b.x} y={b.y} />
      ))}

      <div className="flex w-full max-w-5xl items-center justify-between gap-28">
        <div className="flex flex-1 flex-col gap-14">
          {words.map((_, i) => (
            <Tile
              key={`l-${i}`}
              side="left"
              slot={i}
              innerRef={(el) => {
                leftRefs.current[i] = el;
              }}
            />
          ))}
        </div>

        <div className="flex flex-1 flex-col gap-14">
          {rightOrder.map((_, slot) => (
            <Tile
              key={`r-${slot}`}
              side="right"
              slot={slot}
              innerRef={(el) => {
                rightRefs.current[slot] = el;
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
