// src/components/minigames/MatchSpokenWord.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { playWord, playPraise, playCorrection } from '@/lib/audio';
import Confetti from '@/components/game/Confetti';
import { MAX_ATTEMPTS } from '@/lib/progression';
import type { Word } from '@/data/words';
import type { HostChoice } from '@/types';

// Match to Spoken Word
//
// She hears a word and taps it from a set of choices. This is the core
// sight-word skill — connecting a sound she already knows to a shape she
// is learning — and unlike Match the Words, she cannot succeed by
// comparing shapes. She has to actually know the word.
//
// The same anti-guessing rules apply: only a clean first attempt counts,
// the choices reshuffle after a miss, and after two misses the answer is
// shown rather than leaving her stuck.

export type Question = { target: Word; choices: Word[] };

type Props = {
  questions: Question[];
  host: HostChoice;
  onAnswer: (word: string, correct: boolean, firstTry: boolean) => void;
  onRoundDone: () => void;
};

const THEME = {
  maya: {
    tile: 'rgba(255, 227, 238, 0.62)',
    words: ['#52CBFF', '#FFC29B', '#DB5CFF', '#F49AC1'],
  },
  alex: {
    tile: 'rgba(136, 149, 249, 0.50)',
    words: ['#FFF731', '#7DF376', '#D80041', '#52CBFF'],
  },
} as const;

export default function MatchSpokenWord({
  questions,
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
  const [shuffleKey, setShuffleKey] = useState(0);
  const [burst, setBurst] = useState(false);
  const [entered, setEntered] = useState(false);

  const speakerRef = useRef<HTMLButtonElement>(null);
  const question = questions[index];

  // Shuffle the choices; reshuffles on a miss so the layout can't be
  // memorised.
  const choices = useMemo(() => {
    if (!question) return [];
    const all = [question.target, ...question.choices];
    return [...all].sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, shuffleKey]);

  // New question — say it once, unprompted.
  useEffect(() => {
    if (!question) return;

    setAttempts(0);
    setPicked(null);
    setRevealed(false);
    setLocked(false);
    setBurst(false);
    setEntered(false);

    const enter = setTimeout(() => setEntered(true), 1200);
    const speak = setTimeout(() => playWord(question.target.word), 450);

    return () => {
      clearTimeout(enter);
      clearTimeout(speak);
    };
  }, [question]);

  if (!question) return null;

  function nextQuestion() {
    if (index + 1 >= questions.length) onRoundDone();
    else setIndex(index + 1);
  }

  async function choose(word: string) {
    if (locked || revealed) return;

    const correct = word === question.target.word;
    setPicked(word);

    if (correct) {
      setLocked(true);
      setBurst(true);

      const firstTry = attempts === 0;
      onAnswer(question.target.word, true, firstTry);

      if (firstTry) await playPraise(host);
      else await playWord(question.target.word);

      setTimeout(nextQuestion, 900);
      return;
    }

    // Wrong.
    const tries = attempts + 1;
    setAttempts(tries);

    if (tries === 1) onAnswer(question.target.word, false, true);
    await playCorrection(host);

    if (tries >= MAX_ATTEMPTS) {
      // Show her which one it was, then move on.
      setRevealed(true);
      setLocked(true);
      await playWord(question.target.word);
      onAnswer(question.target.word, true, false);
      setTimeout(nextQuestion, 1600);
    } else {
      setPicked(null);
      setShuffleKey((k) => k + 1);
    }
  }

  function tileStyle(word: string) {
    const isTarget = word === question.target.word;

    if (revealed && isTarget) return 'bg-mint text-white border-white';
    if (picked === word && isTarget)
      return 'animate-cheer bg-mint text-white border-white';
    if (picked === word) return 'animate-shake bg-rose/70 text-white border-white';
    return '';
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-8 px-6 py-4">
      <p className="font-game absolute top-1 rounded-full bg-white/90 px-10 py-3 text-4xl text-grape shadow-lg">
        Tap the word you hear!
      </p>

      {/* The big listen button */}
      <button
        ref={speakerRef}
        onClick={() => playWord(question.target.word)}
        aria-label="Hear the word again"
        className="animate-pop-in flex h-40 w-40 items-center justify-center rounded-full border-[8px] border-white text-7xl shadow-2xl transition-transform active:scale-90"
        style={{
          background: theme.tile,
          backdropFilter: 'blur(6px)',
          boxShadow:
            'inset 0 5px 12px rgba(255,255,255,0.85), inset 0 -6px 14px rgba(0,0,0,0.12), 0 12px 26px rgba(0,0,0,0.25)',
        }}
      >
        🔊
      </button>

      {burst && <Confetti x="50%" y="42%" pieces={18} spread={220} />}

      {/* The choices */}
      <div className="flex flex-wrap items-center justify-center gap-8">
        {choices.map((w, i) => (
          <button
            key={`${w.word}-${shuffleKey}`}
            onClick={() => choose(w.word)}
            disabled={locked}
            style={{
              background: theme.tile,
              borderColor: 'rgba(255,255,255,0.9)',
              animationDelay: `${i * 110}ms`,
              boxShadow:
                'inset 0 3px 8px rgba(255,255,255,0.85), inset 0 -4px 10px rgba(0,0,0,0.10), 0 8px 18px rgba(0,0,0,0.18)',
            }}
            className={`
              min-w-[240px] rounded-[1.6rem] border-4 px-8 py-1
              backdrop-blur-md transition-transform duration-200
              ${entered ? 'hover-hop' : 'animate-tile'}
              ${tileStyle(w.word)}
            `}
          >
            <span
              className="font-display text-engraved text-7xl"
              style={{
                color:
                  (revealed && w.word === question.target.word) ||
                  (picked === w.word)
                    ? '#ffffff'
                    : theme.words[i % theme.words.length],
              }}
            >
              {w.word}
            </span>
          </button>
        ))}
      </div>

      {/* Which question of the set */}
      <p className="font-game absolute bottom-1 text-2xl text-white/70 drop-shadow">
        {index + 1} / {questions.length}
      </p>
    </div>
  );
}
