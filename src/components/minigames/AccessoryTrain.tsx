// src/components/minigames/AccessoryTrain.tsx
'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import { playSound, playWord, playPraise, playCorrection } from '@/lib/audio';
import Confetti from '@/components/game/Confetti';
import type { Word } from '@/data/words';
import type { HostChoice } from '@/types';

// The Accessory Train — sound segmenting
//
// A word is broken into its sounds and she drags each one into its own
// pet bed, in order. Every tile plays its sound as it lands.
//
// This is Elkonin sound boxes, which is about as close to a gold
// standard as early literacy teaching has. Snail Talk asks her to push
// sounds together; this asks her to pull them apart, which is the
// harder half and the one that underpins spelling.
//
// The tiles are the word's phonemes rather than single letters, so
// "fish" comes apart as f · i · sh — three sounds, three boxes — which
// is how the word actually works.

type Props = {
  words: Word[];
  host: HostChoice;
  onAnswer: (word: string, correct: boolean, firstTry: boolean) => void;
  onRoundDone: () => void;
};

type Point = { x: number; y: number };

const THEME = {
  maya: {
    tile: 'rgba(255, 227, 238, 0.72)',
    letter: '#DB5CFF',
    bed: 'rgba(255, 255, 255, 0.45)',
    accent: '#F49AC1',
  },
  alex: {
    tile: 'rgba(136, 149, 249, 0.62)',
    letter: '#FFF731',
    bed: 'rgba(255, 255, 255, 0.40)',
    accent: '#8895F9',
  },
} as const;

// The bed artwork each slot uses, cycled so a long word isn't monotonous.
const BEDS = [
  '/images/rewards/PetReward_Bed_Pink.webp',
  '/images/rewards/PetReward_Bed_Blue.webp',
  '/images/rewards/PetReward_Bed_Green.webp',
  '/images/rewards/PetReward_Bed_Purple.webp',
  '/images/rewards/PetReward_Bed_Tan.webp',
];

export default function AccessoryTrain({
  words,
  host,
  onAnswer,
  onRoundDone,
}: Props) {
  const theme = THEME[host];

  const containerRef = useRef<HTMLDivElement>(null);
  const bedRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [index, setIndex] = useState(0);
  // Which phoneme index sits in each box, or null for an empty box.
  const [filled, setFilled] = useState<(number | null)[]>([]);
  // Phoneme indices still waiting in the tray, in display order.
  const [tray, setTray] = useState<number[]>([]);
  const [wrongBox, setWrongBox] = useState<number | null>(null);
  const [missed, setMissed] = useState(false);
  const [done, setDone] = useState(false);

  const [dragging, setDragging] = useState<number | null>(null);
  const [pointer, setPointer] = useState<Point | null>(null);

  const finished = useRef(false);
  const word = words[index];
  const phonemes = word?.phonemes ?? [];

  // ---------------------------------------------------------
  // New word
  // ---------------------------------------------------------
  useEffect(() => {
    finished.current = false;
  }, [words]);

  useEffect(() => {
    if (!word?.phonemes) return;

    setFilled(new Array(word.phonemes.length).fill(null));
    setTray(
      word.phonemes.map((_, i) => i).sort(() => Math.random() - 0.5)
    );
    setWrongBox(null);
    setMissed(false);
    setDone(false);
    setDragging(null);
    setPointer(null);

    const id = setTimeout(() => playWord(word.word), 450);
    return () => clearTimeout(id);
  }, [word]);

  // ---------------------------------------------------------
  // Finished when every box is filled
  // ---------------------------------------------------------
  useEffect(() => {
    if (done || filled.length === 0) return;
    if (filled.some((f) => f === null)) return;

    setDone(true);

    (async () => {
      // Read it back sound by sound, then whole.
      for (let i = 0; i < phonemes.length; i++) {
        await playSound(phonemes[i]);
      }
      await playWord(word.word);

      onAnswer(word.word, true, !missed);
      if (!missed) await playPraise(host);

      setTimeout(() => {
        if (index + 1 >= words.length) {
          if (finished.current) return;
          finished.current = true;
          onRoundDone();
        } else {
          setIndex(index + 1);
        }
      }, 700);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filled]);

  // ---------------------------------------------------------
  // Dragging
  // ---------------------------------------------------------
  function toLocal(e: React.PointerEvent): Point {
    const box = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  }

  function startDrag(phonemeIndex: number, e: React.PointerEvent) {
    if (done) return;
    playSound(phonemes[phonemeIndex]);
    setDragging(phonemeIndex);
    setPointer(toLocal(e));
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function moveDrag(e: React.PointerEvent) {
    if (dragging === null) return;
    setPointer(toLocal(e));
  }

  async function endDrag(e: React.PointerEvent) {
    if (dragging === null) return;

    const phonemeIndex = dragging;
    setDragging(null);
    setPointer(null);

    const dropped = document.elementFromPoint(e.clientX, e.clientY);
    const slot = bedRefs.current.findIndex(
      (el) => el && dropped && (el === dropped || el.contains(dropped))
    );

    if (slot === -1) return; // dropped on nothing
    if (filled[slot] !== null) return; // box already taken

    // Right sound, right box?
    if (slot === phonemeIndex) {
      const next = [...filled];
      next[slot] = phonemeIndex;
      setFilled(next);
      setTray(tray.filter((t) => t !== phonemeIndex));
      playSound(phonemes[phonemeIndex]);
    } else {
      setMissed(true);
      setWrongBox(slot);
      setTimeout(() => setWrongBox(null), 650);
      playCorrection(host);
    }
  }

  if (!word?.phonemes) return null;

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  return (
    <div
      ref={containerRef}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="relative flex h-full w-full flex-col items-center justify-center gap-6 px-6 py-4"
      style={{ touchAction: 'none' }}
    >
      <p className="font-game absolute top-1 rounded-full bg-white/90 px-10 py-3 text-4xl text-grape shadow-lg">
        Put each sound in its own bed!
      </p>

      {/* The word, said aloud on tap */}
      <button
        onClick={() => playWord(word.word)}
        aria-label={`Hear the word ${word.word}`}
        className="transition-transform active:scale-95"
      >
        <span
          className="font-display text-engraved text-7xl"
          style={{ color: theme.letter }}
        >
          {word.word}
        </span>
      </button>

      {/* The beds */}
      <div className="flex items-end justify-center gap-8">
        {phonemes.map((_, slot) => {
          const held = filled[slot];
          const isWrong = wrongBox === slot;

          return (
            <div
              key={slot}
              ref={(el) => {
                bedRefs.current[slot] = el;
              }}
              className={`relative flex h-40 w-40 items-center justify-center ${
                isWrong ? 'animate-shake' : ''
              }`}
            >
              {/* The bed itself */}
              <Image
                src={BEDS[slot % BEDS.length]}
                alt=""
                fill
                sizes="160px"
                className="object-contain"
                style={{
                  opacity: held === null ? 0.55 : 1,
                  filter:
                    held === null
                      ? 'grayscale(0.4)'
                      : 'drop-shadow(0 6px 10px rgba(0,0,0,0.25))',
                }}
              />

              {/* The sound that landed in it */}
              {held !== null && (
                <span
                  className="animate-pop-in font-display text-engraved relative text-6xl"
                  style={{ color: theme.letter }}
                >
                  {phonemes[held]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* The tray of sounds still to place */}
      <div className="flex min-h-[7rem] items-center justify-center gap-6">
        {tray.map((phonemeIndex) => (
          <button
            key={phonemeIndex}
            onPointerDown={(e) => startDrag(phonemeIndex, e)}
            aria-label={`Sound ${phonemes[phonemeIndex]}`}
            style={{
              background: theme.tile,
              borderColor: 'rgba(255,255,255,0.95)',
              touchAction: 'none',
              opacity: dragging === phonemeIndex ? 0.35 : 1,
              boxShadow:
                'inset 0 3px 8px rgba(255,255,255,0.85), inset 0 -4px 10px rgba(0,0,0,0.10), 0 8px 18px rgba(0,0,0,0.2)',
            }}
            className="hover-hop h-24 min-w-[6rem] rounded-[1.25rem] border-4 px-4 backdrop-blur-md transition-transform duration-200"
          >
            <span
              className="font-display text-engraved text-5xl"
              style={{ color: theme.letter }}
            >
              {phonemes[phonemeIndex]}
            </span>
          </button>
        ))}

        {tray.length === 0 && !done && (
          <p className="font-game text-2xl text-white/70">…</p>
        )}
      </div>

      {/* The tile following her finger */}
      {dragging !== null && pointer && (
        <div
          className="pointer-events-none absolute z-50 flex h-24 min-w-[6rem] items-center justify-center rounded-[1.25rem] border-4 px-4"
          style={{
            left: pointer.x,
            top: pointer.y,
            transform: 'translate(-50%, -50%) scale(1.1)',
            background: theme.tile,
            borderColor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 14px 20px rgba(0,0,0,0.35)',
          }}
        >
          <span
            className="font-display text-engraved text-5xl"
            style={{ color: theme.letter }}
          >
            {phonemes[dragging]}
          </span>
        </div>
      )}

      {done && <Confetti x="50%" y="45%" pieces={22} spread={260} />}

      <p className="font-game absolute bottom-1 text-2xl text-white/70 drop-shadow">
        {index + 1} / {words.length}
      </p>
    </div>
  );
}
