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
// Nothing plays on its own. The child taps the speaker when she's ready,
// and steps forward with the arrows. Auto-play fought with the browser's
// speech engine and the two drifted apart.

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

/** The welcome sequence. */
export const WELCOME_STEPS: IntroStep[] = [
  { clip: 'intro-1', pose: 'neutral' },
  { clip: 'intro-2', pose: 'explaining' },
  // Turned around, pointing back at the meter on the left.
  { clip: 'intro-3', pose: 'explaining', flip: true },
  { clip: 'intro-4', pose: 'explaining', flip: true },
  { clip: 'intro-5', pose: 'excited' },
  { clip: 'intro-6', pose: 'explaining' },
  { clip: 'intro-7', pose: 'thumbsup' },
];

/** A one-line explanation, used for mini game instructions. */
export function gameStep(clip: string): IntroStep[] {
  return [{ clip, pose: 'explaining' }];
}

type Props = {
  host: HostChoice;
  steps: IntroStep[];
  /** Kept for call-site clarity; the character is sized the same either way. */
  variant?: 'welcome' | 'game';
  onStep?: (index: number) => void;
  /** Fires when the speaker is tapped, so cues can be timed to speech. */
  onSpeak?: (index: number) => void;
  onDone: () => void;
};

export default function HostIntro({
  host,
  steps,
  variant: _variant = 'welcome',
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
    if (next < 0) return;
    if (next >= steps.length) return onDone();
    setIndex(next);
  }

  return (
    <div className="absolute inset-0 z-30">
      {/* Character.
          Fixed size and position throughout — the only thing that changes
          between steps is which way she faces. Moving her around made her
          appear to glide across the floor. */}
      <div className="absolute bottom-0 left-[1%] h-[62%]">
        <div className="animate-breathe relative h-full" style={{ aspectRatio: '3 / 5' }}>
          <Image
            src={POSES[host][step.pose]}
            alt=""
            fill
            sizes="(max-width: 768px) 50vw, 40vw"
            priority
            className="object-contain object-bottom"
            style={{
              transform: step.flip ? 'scaleX(-1)' : undefined,
              transition: 'transform 400ms ease-out',
            }}
          />
        </div>
      </div>

      {/* Speech bubble */}
      <div
        className="animate-pop-in absolute left-[26%] top-[8%] max-w-2xl rounded-[2rem] border-8 border-white bg-white/95 px-10 py-8 shadow-2xl" 
      >
        <div className="flex items-start gap-5">
          <button
            onClick={speakLine}
            aria-label="Hear it"
            className={`shrink-0 rounded-full border-4 border-white bg-sky px-5 py-4 text-4xl shadow-lg transition-transform active:scale-90 ${
              speaking ? 'animate-bob' : 'animate-pop-in'
            }`}
          >
            🔊
          </button>

          <p key={index} className="font-game text-4xl leading-relaxed text-ink">
            {caption}
          </p>
        </div>

        {/* Step arrows, inside the bubble */}
        {steps.length > 1 && (
          <div className="mt-5 flex items-center justify-between border-t-2 border-ink/10 pt-3">
            <button
              onClick={() => go(-1)}
              disabled={index === 0}
              aria-label="Previous"
              className="rounded-full border-2 border-ink/15 px-4 py-1 text-2xl text-grape transition-transform active:scale-90 disabled:opacity-25"
            >
              ←
            </button>

            <span className="font-game text-2xl text-ink/40">
              {index + 1} / {steps.length}
            </span>

            <button
              onClick={() => go(1)}
              disabled={last}
              aria-label="Next"
              className="rounded-full border-2 border-ink/15 px-4 py-1 text-2xl text-grape transition-transform active:scale-90 disabled:opacity-25"
            >
              →
            </button>
          </div>
        )}

        {/* tail */}
        <div className="absolute -bottom-5 left-16 h-0 w-0 border-l-[24px] border-r-[24px] border-t-[28px] border-l-transparent border-r-transparent border-t-white" />
      </div>

      {/* Skip — a big arrow, bottom right */}
      {!last && (
        <button
          onClick={onDone}
          aria-label="Skip"
          className="absolute bottom-8 right-8 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/80 text-5xl text-grape shadow-xl transition-transform active:scale-90"
        >
          ➤
        </button>
      )}

      {/* Finish — grows and wiggles once she's done talking */}
      {last && (
        <button
          onClick={onDone}
          className={`font-display absolute bottom-8 right-8 rounded-full border-[6px] border-white bg-mint px-16 py-7 text-5xl text-white shadow-2xl transition-transform duration-300 active:scale-95 ${
            spoken ? 'hover-hop scale-110' : 'scale-100'
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
