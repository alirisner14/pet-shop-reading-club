// src/components/minigames/SnailTalk.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { playBlend, playWord, playPraise, playCorrection } from '@/lib/audio';
import Confetti from '@/components/game/Confetti';
import PetSprite from '@/components/game/PetSprite';
import { MAX_ATTEMPTS } from '@/lib/progression';
import type { Word } from '@/data/words';
import type { Pet } from '@/data/pets';
import type { HostChoice } from '@/types';

// Snail Talk — phoneme blending
//
// The pet asks for something in a very slow voice: /c/ ... /a/ ... /t/.
// She has to slide those sounds together into a word and tap it.
//
// This is the single most valuable game here. Oral blending is the best
// early predictor of reading, and it's the skill that turns memorised
// sight words into the ability to decode words she has never seen.
//
// A note on the design: the original sketch had her tap a picture of the
// treat. Only four words in the whole list have both a picture and a
// phoneme breakdown, so a picture version would cycle the same four
// words forever. Tapping the written word works with every decodable
// word AND connects the sounds to the letters, which is the point.

type Props = {
  /** The words she has to work out — one per question. */
  words: Word[];
  /** Other decodable words, used only to fill the choice row. */
  pool: Word[];
  host: HostChoice;
  pet: Pet | null;
  petName?: string | null;
  onAnswer: (word: string, correct: boolean, firstTry: boolean) => void;
  onRoundDone: () => void;
};

const THEME = {
  maya: { tile: 'rgba(255, 227, 238, 0.62)', words: ['#52CBFF', '#FFC29B', '#DB5CFF'] },
  alex: { tile: 'rgba(136, 149, 249, 0.50)', words: ['#FFF731', '#7DF376', '#D80041'] },
} as const;

/** How long the gap between sounds is. Slower than speech, on purpose. */
const BLEND_GAP = 650;

export default function SnailTalk({
  words,
  pool,
  host,
  pet,
  petName,
  onAnswer,
  onRoundDone,
}: Props) {
  const theme = THEME[host];

  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [locked, setLocked] = useState(false);
  const [burst, setBurst] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);

  const finished = useRef(false);
  const target = words[index];

  // Three other words to choose from. Similar lengths, so she can't pick
  // by counting sounds.
  const choices = useMemo(() => {
    if (!target) return [];

    const others = pool
      .filter((w) => w.word !== target.word)
      .sort(
        (a, b) =>
          Math.abs(a.word.length - target.word.length) -
          Math.abs(b.word.length - target.word.length)
      )
      .slice(0, 3);

    return [target, ...others].sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.word, shuffleKey]);

  useEffect(() => {
    finished.current = false;
  }, [words]);

  // Say it slowly when the word appears.
  useEffect(() => {
    if (!target?.phonemes) return;

    setAttempts(0);
    setPicked(null);
    setRevealed(false);
    setLocked(false);
    setBurst(false);

    const id = setTimeout(() => sayItSlowly(), 600);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  if (!target?.phonemes) return null;

  async function sayItSlowly() {
    if (playing) return;
    setPlaying(true);
    await playBlend(target.phonemes!, BLEND_GAP);
    setPlaying(false);
  }

  function nextWord() {
    if (index + 1 >= words.length) {
      if (finished.current) return;
      finished.current = true;
      onRoundDone();
    } else {
      setIndex(index + 1);
    }
  }

  async function choose(wordText: string) {
    if (locked || revealed || playing) return;
    setPicked(wordText);

    if (wordText === target.word) {
      setLocked(true);
      setBurst(true);
      const firstTry = attempts === 0;
      onAnswer(target.word, true, firstTry);

      // Hearing the whole word right after the sounds is what closes
      // the loop: these pieces make this word.
      await playWord(target.word);
      if (firstTry) await playPraise(host);

      setTimeout(nextWord, 800);
      return;
    }

    const tries = attempts + 1;
    setAttempts(tries);
    if (tries === 1) onAnswer(target.word, false, true);
    await playCorrection(host);

    if (tries >= MAX_ATTEMPTS) {
      setRevealed(true);
      setLocked(true);
      await playBlend(target.phonemes!, 400);
      await playWord(target.word);
      onAnswer(target.word, true, false);
      setTimeout(nextWord, 1500);
    } else {
      setPicked(null);
      setShuffleKey((k) => k + 1);
      setTimeout(sayItSlowly, 400);
    }
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-5 px-6 py-4">
      <p className="font-game absolute top-1 rounded-full bg-white/90 px-10 py-3 text-4xl text-grape shadow-lg">
        {petName ? `${petName} is hungry!` : 'Listen to the sounds!'}
      </p>

      {/* The pet, asking */}
      <div className="flex items-center gap-6">
        {pet && (
          <div className="h-32 w-32 shrink-0">
            <PetSprite pet={pet} sizes="15vw" className="h-full w-full" />
          </div>
        )}

        {/* Say it again */}
        <button
          onClick={sayItSlowly}
          disabled={playing}
          aria-label="Hear the sounds again"
          className="flex h-36 w-36 items-center justify-center rounded-full border-[8px] border-white text-6xl shadow-2xl transition-transform active:scale-90 disabled:opacity-60"
          style={{
            background: theme.tile,
            backdropFilter: 'blur(6px)',
            boxShadow:
              'inset 0 5px 12px rgba(255,255,255,0.85), inset 0 -6px 14px rgba(0,0,0,0.12), 0 12px 26px rgba(0,0,0,0.25)',
          }}
        >
          <span className={playing ? 'animate-breathe' : ''}>🐌</span>
        </button>
      </div>

      {/* Dots showing how many sounds are in the word */}
      <div className="flex gap-3">
        {target.phonemes.map((_, i) => (
          <span
            key={i}
            className="block h-4 w-10 rounded-full border-2 border-white"
            style={{ background: 'rgba(255,255,255,0.55)' }}
          />
        ))}
      </div>

      {burst && <Confetti x="50%" y="42%" pieces={18} spread={220} />}

      {/* Word choices */}
      <div className="flex flex-wrap items-center justify-center gap-6">
        {choices.map((w, i) => {
          const isAnswer = w.word === target.word;
          const chosen = picked === w.word;

          return (
            <button
              key={`${w.word}-${shuffleKey}`}
              onClick={() => choose(w.word)}
              disabled={locked || playing}
              style={{
                background:
                  (revealed && isAnswer) || (chosen && isAnswer)
                    ? '#7DD8A0'
                    : chosen
                      ? 'rgba(244,154,193,0.75)'
                      : theme.tile,
                borderColor: 'rgba(255,255,255,0.9)',
                animationDelay: `${i * 110}ms`,
                boxShadow:
                  'inset 0 3px 8px rgba(255,255,255,0.85), inset 0 -4px 10px rgba(0,0,0,0.10), 0 8px 18px rgba(0,0,0,0.18)',
              }}
              className={`
                animate-tile min-w-[200px] rounded-[1.6rem] border-4 px-7 py-1
                backdrop-blur-md transition-transform duration-200
                ${!locked && !playing ? 'hover-hop' : ''}
                ${chosen && !isAnswer ? 'animate-shake' : ''}
                ${chosen && isAnswer ? 'animate-cheer' : ''}
              `}
            >
              <span
                className="font-display text-engraved text-6xl"
                style={{
                  color:
                    chosen || (revealed && isAnswer)
                      ? '#ffffff'
                      : theme.words[i % theme.words.length],
                }}
              >
                {w.word}
              </span>
            </button>
          );
        })}
      </div>

      <p className="font-game absolute bottom-1 text-2xl text-white/70 drop-shadow">
        {index + 1} / {words.length}
      </p>
    </div>
  );
}
