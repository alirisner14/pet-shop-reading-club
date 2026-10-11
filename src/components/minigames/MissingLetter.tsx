// src/components/minigames/MissingLetter.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { playWord, playWordNow, playPraise, playCorrection } from '@/lib/audio';
import Confetti from '@/components/game/Confetti';
import { MAX_ATTEMPTS } from '@/lib/progression';
import type { Word } from '@/data/words';
import type { HostChoice } from '@/types';

// Find the Missing Letter
//
// One letter is taken out of a word and she picks it from four tiles.
// This is the step from recognising a word's shape to noticing the
// letters inside it — the first point where spelling starts.
//
// The wrong choices are weighted toward letters that are easy to
// confuse (b/d, p/q, m/n), because picking between 'b' and 'w' teaches
// nothing.

const CONFUSABLE: Record<string, string[]> = {
  b: ['d', 'p', 'q'],
  d: ['b', 'p', 'q'],
  p: ['q', 'b', 'd'],
  q: ['p', 'b', 'd'],
  m: ['n', 'w', 'h'],
  n: ['m', 'u', 'h'],
  u: ['n', 'v', 'y'],
  v: ['w', 'u', 'y'],
  w: ['v', 'm', 'u'],
  a: ['e', 'o', 'u'],
  e: ['a', 'o', 'c'],
  i: ['l', 'j', 't'],
  o: ['a', 'e', 'c'],
  g: ['q', 'j', 'y'],
  s: ['z', 'c', 'x'],
  t: ['f', 'l', 'i'],
  f: ['t', 'l', 'k'],
  h: ['n', 'b', 'k'],
  l: ['i', 't', 'j'],
  r: ['n', 'h', 'k'],
  c: ['e', 'o', 's'],
  k: ['h', 'x', 'f'],
  y: ['v', 'g', 'j'],
  j: ['i', 'g', 'y'],
  z: ['s', 'x', 'n'],
  x: ['k', 'z', 'y'],
};

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

type Props = {
  words: Word[];
  host: HostChoice;
  onAnswer: (word: string, correct: boolean, firstTry: boolean) => void;
  onRoundDone: () => void;
};

const THEME = {
  maya: { tile: 'rgba(255, 227, 238, 0.62)', word: '#DB5CFF', letter: '#52CBFF' },
  alex: { tile: 'rgba(136, 149, 249, 0.50)', word: '#FFF731', letter: '#7DF376' },
} as const;

export default function MissingLetter({
  words,
  host,
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
  const [shuffleKey, setShuffleKey] = useState(0);

  const finished = useRef(false);
  const word = words[index];

  // Which letter is hidden. Never the first letter — that's the one she
  // leans on hardest to recognise a word at all.
  const hiddenAt = useMemo(() => {
    if (!word) return 1;
    const letters = word.word.length;
    if (letters <= 2) return letters - 1;
    return 1 + Math.floor(Math.random() * (letters - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word?.word]);

  const answer = word ? word.word[hiddenAt].toLowerCase() : '';

  const choices = useMemo(() => {
    if (!word) return [];

    const similar = CONFUSABLE[answer] ?? [];
    const pool = [...similar];

    // Top up from the alphabet if needed.
    while (pool.length < 3) {
      const letter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      if (letter !== answer && !pool.includes(letter)) pool.push(letter);
    }

    return [answer, ...pool.slice(0, 3)].sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word?.word, hiddenAt, shuffleKey]);

  useEffect(() => {
    finished.current = false;
  }, [words]);

  useEffect(() => {
    if (!word) return;
    setAttempts(0);
    setPicked(null);
    setRevealed(false);
    setLocked(false);
    setBurst(false);

    const id = setTimeout(() => playWord(word.word), 400);
    return () => clearTimeout(id);
  }, [word]);

  if (!word) return null;

  function nextWord() {
    if (index + 1 >= words.length) {
      if (finished.current) return;
      finished.current = true;
      onRoundDone();
    } else {
      setIndex(index + 1);
    }
  }

  async function choose(letter: string) {
    if (locked || revealed) return;
    setPicked(letter);

    if (letter === answer) {
      setLocked(true);
      setBurst(true);
      const firstTry = attempts === 0;
      onAnswer(word.word, true, firstTry);
      await (firstTry ? playPraise(host) : playWord(word.word));
      setTimeout(nextWord, 900);
      return;
    }

    const tries = attempts + 1;
    setAttempts(tries);
    if (tries === 1) onAnswer(word.word, false, true);
    await playCorrection(host);

    if (tries >= MAX_ATTEMPTS) {
      setRevealed(true);
      setLocked(true);
      await playWord(word.word);
      onAnswer(word.word, true, false);
      setTimeout(nextWord, 1700);
    } else {
      setPicked(null);
      setShuffleKey((k) => k + 1);
    }
  }

  const shown = revealed || (picked === answer && locked);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-6 px-6 py-4">
      <p className="font-game absolute top-1 rounded-full bg-white/90 px-10 py-3 text-4xl text-grape shadow-lg">
        Which letter is missing?
      </p>

      {/* The word, with a gap */}
      <button
        onClick={() => playWordNow(word.word)}
        aria-label={`Hear the word ${word.word}`}
        className="flex items-end gap-2 transition-transform active:scale-95"
      >
        {word.word.split('').map((letter, i) => (
          <span
            key={`${word.word}-${i}`}
            className="font-display text-engraved text-8xl"
            style={{
              color: i === hiddenAt && !shown ? 'transparent' : theme.word,
              borderBottom:
                i === hiddenAt && !shown ? `8px solid ${theme.letter}` : 'none',
              minWidth: i === hiddenAt ? '0.7em' : undefined,
              display: 'inline-block',
            }}
          >
            {i === hiddenAt && !shown ? '\u00A0' : letter}
          </span>
        ))}
      </button>

      {burst && <Confetti x="50%" y="38%" pieces={18} spread={220} />}

      {/* Letter choices */}
      <div className="flex flex-wrap items-center justify-center gap-6">
        {choices.map((letter, i) => {
          const isAnswer = letter === answer;
          const chosen = picked === letter;

          return (
            <button
              key={`${letter}-${shuffleKey}`}
              onClick={() => choose(letter)}
              disabled={locked}
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
                animate-tile h-28 w-28 rounded-[1.5rem] border-4 backdrop-blur-md
                transition-transform duration-200
                ${!locked ? 'hover-hop' : ''}
                ${chosen && !isAnswer ? 'animate-shake' : ''}
                ${chosen && isAnswer ? 'animate-cheer' : ''}
              `}
            >
              <span
                className="font-display text-engraved text-6xl"
                style={{
                  color: chosen || (revealed && isAnswer) ? '#ffffff' : theme.letter,
                }}
              >
                {letter}
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
