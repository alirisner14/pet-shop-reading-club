// src/components/minigames/MatchPicture.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { playWord, playPraise, playCorrection } from '@/lib/audio';
import Confetti from '@/components/game/Confetti';
import { MAX_ATTEMPTS } from '@/lib/progression';
import type { Word } from '@/data/words';
import type { HostChoice } from '@/types';

// Match the Word to the Picture
//
// A picture is shown and she picks the word that goes with it. This is
// the first game where the word has to carry meaning rather than just
// sound or shape — she can't get here by matching letters.
//
// Only works for words that can be drawn, which is why the pool is
// colors and pet-shop words. "the" and "was" have no picture, and
// pretending otherwise would teach a false association.

export type PictureQuestion = { target: Word; choices: Word[] };

type Props = {
  questions: PictureQuestion[];
  host: HostChoice;
  onAnswer: (word: string, correct: boolean, firstTry: boolean) => void;
  onRoundDone: () => void;
};

const THEME = {
  maya: {
    tile: 'rgba(255, 227, 238, 0.62)',
    words: ['#52CBFF', '#FFC29B', '#DB5CFF'],
  },
  alex: {
    tile: 'rgba(136, 149, 249, 0.50)',
    words: ['#FFF731', '#7DF376', '#D80041'],
  },
} as const;

export default function MatchPicture({
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
  const [burst, setBurst] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [entered, setEntered] = useState(false);

  const finished = useRef(false);
  const question = questions[index];

  const choices = useMemo(() => {
    if (!question) return [];
    return [question.target, ...question.choices].sort(
      () => Math.random() - 0.5
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, shuffleKey]);

  useEffect(() => {
    finished.current = false;
  }, [questions]);

  useEffect(() => {
    if (!question) return;
    setAttempts(0);
    setPicked(null);
    setRevealed(false);
    setLocked(false);
    setBurst(false);
    setEntered(false);

    const show = setTimeout(() => setEntered(true), 1100);
    return () => clearTimeout(show);
  }, [question]);

  if (!question) return null;

  function nextQuestion() {
    if (index + 1 >= questions.length) {
      if (finished.current) return;
      finished.current = true;
      onRoundDone();
    } else {
      setIndex(index + 1);
    }
  }

  async function choose(wordText: string) {
    if (locked || revealed) return;
    setPicked(wordText);

    if (wordText === question.target.word) {
      setLocked(true);
      setBurst(true);
      const firstTry = attempts === 0;
      onAnswer(question.target.word, true, firstTry);
      await (firstTry ? playPraise(host) : playWord(question.target.word));
      setTimeout(nextQuestion, 900);
      return;
    }

    const tries = attempts + 1;
    setAttempts(tries);
    if (tries === 1) onAnswer(question.target.word, false, true);
    await playCorrection(host);

    if (tries >= MAX_ATTEMPTS) {
      setRevealed(true);
      setLocked(true);
      await playWord(question.target.word);
      onAnswer(question.target.word, true, false);
      setTimeout(nextQuestion, 1700);
    } else {
      setPicked(null);
      setShuffleKey((k) => k + 1);
    }
  }

  const picture = question.target.picture;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-6 px-6 py-4">
      <p className="font-game absolute top-1 rounded-full bg-white/90 px-10 py-3 text-4xl text-grape shadow-lg">
        Which word goes with the picture?
      </p>

      {/* The picture. Colors are drawn as a swatch; everything else is
          artwork we already have. */}
      <div
        className="animate-pop-in flex h-[34%] w-[30%] items-center justify-center rounded-[2rem] border-[8px] border-white shadow-2xl"
        style={{
          background:
            picture?.kind === 'color' ? picture.value : 'rgba(255,255,255,0.75)',
          boxShadow:
            'inset 0 4px 12px rgba(255,255,255,0.6), 0 12px 26px rgba(0,0,0,0.25)',
        }}
      >
        {picture?.kind === 'image' && (
          <div className="relative h-full w-full p-3">
            <Image
              src={`/images/${picture.value}`}
              alt=""
              fill
              sizes="30vw"
              className="object-contain"
              style={{ filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.22))' }}
            />
          </div>
        )}
      </div>

      {burst && <Confetti x="50%" y="40%" pieces={18} spread={220} />}

      {/* Word choices */}
      <div className="flex flex-wrap items-center justify-center gap-7">
        {choices.map((w, i) => {
          const isAnswer = w.word === question.target.word;
          const chosen = picked === w.word;

          return (
            <button
              key={`${w.word}-${shuffleKey}`}
              onClick={() => choose(w.word)}
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
                min-w-[220px] rounded-[1.6rem] border-4 px-8 py-1
                backdrop-blur-md transition-transform duration-200
                ${entered && !locked ? 'hover-hop' : 'animate-tile'}
                ${chosen && !isAnswer ? 'animate-shake' : ''}
                ${chosen && isAnswer ? 'animate-cheer' : ''}
              `}
            >
              <span
                className="font-display text-engraved text-7xl"
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
        {index + 1} / {questions.length}
      </p>
    </div>
  );
}
