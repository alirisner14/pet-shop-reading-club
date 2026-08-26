// src/components/host/HostIntro.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { playHost, stopAll } from '@/lib/audio';
import { hostLine } from '@/data/hostScripts';
import type { HostChoice } from '@/types';

// The host's spoken sequences — the first-time welcome, and each mini
// game's instructions.
//
// Nothing plays on its own; the child taps the speaker when she's ready.
// The forward arrow is the only way to advance, and "Let's go!" stays
// locked until the last line has actually finished playing — otherwise
// it's simply the biggest, most tempting button on the screen and the
// whole explanation gets skipped.

export type Pose = 'neutral' | 'explaining' | 'excited' | 'thumbsup';

const POSES: Record<HostChoice, Record<Pose, string>> = {
  maya: {
    neutral: '/images/hosts/maya/Maya_Neutral.webp',
    explaining: '/images/hosts/maya/Maya_Explaining.webp',
    excited: '/images/hosts/maya/Maya_Excited.webp',
    thumbsup: '/images/hosts/maya/Maya_ThumbsUp.webp',
  },
  alex: {
    neutral: '/images/hosts/alex/Alex_Neutral.webp',
    explaining: '/images/hosts/alex/Alex_Pointing1.webp',
    excited: '/images/hosts/alex/Alex_Excited.webp',
    thumbsup: '/images/hosts/alex/Alex_ThumbsUp.webp',
  },
};

export type IntroStep = {
  clip: string;
  pose: Pose;
  /** Mirror the character so she gestures the other way. */
  flip?: boolean;
};

export const WELCOME_STEPS: IntroStep[] = [
  { clip: 'intro-1', pose: 'neutral' },
  { clip: 'intro-2', pose: 'explaining' },
  { clip: 'intro-3', pose: 'explaining', flip: true },
  { clip: 'intro-4', pose: 'explaining', flip: true },
  { clip: 'intro-5', pose: 'excited' },
  { clip: 'intro-6', pose: 'explaining' },
  { clip: 'intro-7', pose: 'thumbsup' },
];

export function gameStep(clip: string): IntroStep[] {
  return [{ clip, pose: 'explaining' }];
}

type Props = {
  host: HostChoice;
  steps: IntroStep[];
  /** Kept for call-site clarity; sizing is the same either way. */
  variant?: 'welcome' | 'game';
  onStep?: (index: number) => void;
  onSpeak?: (index: number) => void;
  onDone: () => void;
};

// ------------------------------------------------------------
// Chunky arrow button
// ------------------------------------------------------------
function ArrowButton({
  direction,
  onClick,
  disabled = false,
  label,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="transition-transform active:scale-90 disabled:opacity-25"
    >
      <svg
        width="74"
        height="52"
        viewBox="0 0 74 52"
        style={{
          transform: direction === 'left' ? 'scaleX(-1)' : undefined,
          filter: 'drop-shadow(0 4px 5px rgba(0,0,0,0.3))',
        }}
      >
        <path
          d="M4 18 H42 V6 L70 26 L42 46 V34 H4 Z"
          fill="#57A9F5"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M8 21 H44"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}

export default function HostIntro({
  host,
  steps,
  onStep,
  onSpeak,
  onDone,
}: Props) {
  const [index, setIndex] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [spoken, setSpoken] = useState(false);

  const step = steps[index];
  const caption = hostLine(step.clip);
  const last = index === steps.length - 1;

  useEffect(() => {
    setSpoken(false);
    onStep?.(index);
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  async function speakLine() {
    onSpeak?.(index);
    setSpeaking(true);
    await playHost(host, step.clip);
    setSpeaking(false);
    setSpoken(true);
  }

  function go(delta: number) {
    stopAll();
    const next = index + delta;
    if (next < 0 || next >= steps.length) return;
    setIndex(next);
  }

  return (
    <div className="absolute inset-0 z-30">
      {/* Character — sized by height, pinned to the bottom-left corner,
          nudged down so her feet crop off the screen edge. */}
      <div className="absolute bottom-0 left-0 h-[74%] w-[48%] translate-y-[7%]">
        <div className="animate-breathe relative h-full w-full">
          <Image
            src={POSES[host][step.pose]}
            alt=""
            fill
            sizes="(max-width: 768px) 60vw, 48vw"
            priority
            className="object-contain"
            style={{
              objectPosition: 'left bottom',
              transform: step.flip ? 'scaleX(-1)' : undefined,
              transition: 'transform 400ms ease-out',
            }}
          />
        </div>
      </div>

      {/* Speech bubble — low and to her right, clear of the play area */}
      <div className="absolute bottom-[4%] left-[33%] w-[30%] min-w-[380px] rounded-[1.75rem] border-4 border-white bg-white px-8 py-6 shadow-2xl">
        <p
          key={index}
          className="font-game text-3xl leading-relaxed text-ink"
        >
          {caption}
        </p>

        {/* Controls */}
        <div className="mt-5 flex items-center justify-between">
          <ArrowButton
            direction="left"
            onClick={() => go(-1)}
            disabled={index === 0}
            label="Previous"
          />

          <button
            onClick={speakLine}
            aria-label="Hear it"
            className={`text-5xl transition-transform active:scale-90 ${
              speaking ? 'animate-breathe' : ''
            }`}
            style={{ filter: 'drop-shadow(0 4px 5px rgba(0,0,0,0.28))' }}
          >
            🔊
          </button>

          <ArrowButton
            direction="right"
            onClick={() => go(1)}
            disabled={last}
            label="Next"
          />
        </div>

        {/* tail, pointing back toward the character */}
        <div className="absolute -left-4 bottom-10 h-0 w-0 border-b-[18px] border-r-[26px] border-t-[18px] border-b-transparent border-r-white border-t-transparent" />
      </div>

      {/* Finish — locked until the last line has actually been heard */}
      {last && (
        <button
          onClick={onDone}
          disabled={!spoken}
          className={`font-display absolute bottom-8 right-8 rounded-full border-[6px] border-white bg-mint px-16 py-7 text-5xl text-white shadow-2xl transition-all duration-300 active:scale-95 ${
            spoken ? 'hover-hop scale-110 opacity-100' : 'scale-95 opacity-30'
          }`}
          style={{
            boxShadow:
              'inset 0 4px 10px rgba(255,255,255,0.5), inset 0 -5px 12px rgba(0,0,0,0.14), 0 12px 26px rgba(0,0,0,0.28)',
          }}
        >
          Let&apos;s go!
        </button>
      )}
    </div>
  );
}
