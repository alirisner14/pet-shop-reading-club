// src/lib/audio.ts
//
// All sound playback goes through here.
//
// Every call tries the recorded MP3 first. If the file isn't there yet,
// it falls back to the browser's built-in text-to-speech so the game is
// playable today. Drop a recording into public/audio/ and it takes over
// automatically — no code change.
//
// One deliberate exception: individual letter SOUNDS never fall back to
// speech. Ask a TTS voice for /f/ and it says "eff", which would teach
// the wrong thing. Those files already exist, so if one is missing we
// stay silent instead.

import type { HostChoice } from '@/types';
import { hostLine } from '@/data/hostScripts';

const cache = new Map<string, HTMLAudioElement>();
const missing = new Set<string>(); // paths already known to 404

function get(src: string): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;

  let el = cache.get(src);
  if (!el) {
    el = new Audio(src);
    el.preload = 'auto';
    cache.set(src, el);
  }
  return el;
}

// ------------------------------------------------------------
// Text to speech
// ------------------------------------------------------------

let voices: SpeechSynthesisVoice[] = [];

function loadVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  voices = window.speechSynthesis.getVoices();
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

/** Best available English voice, preferring a higher-quality one. */
function pickVoice(): SpeechSynthesisVoice | null {
  if (voices.length === 0) loadVoices();

  const english = voices.filter((v) => v.lang.startsWith('en'));
  if (english.length === 0) return null;

  // Google and Microsoft Natural voices sound noticeably better than the
  // default system ones.
  return (
    english.find((v) => /google/i.test(v.name)) ??
    english.find((v) => /natural/i.test(v.name)) ??
    english.find((v) => v.localService) ??
    english[0]
  );
}

type SpeakOptions = { pitch?: number; rate?: number };

/** Speaks text aloud and resolves when finished. */
export function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text) {
      return resolve();
    }

    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) u.voice = voice;

    u.pitch = opts.pitch ?? 1.1; // slightly bright, kid-friendly
    u.rate = opts.rate ?? 0.9; // a touch slower than default
    u.onend = () => resolve();
    u.onerror = () => resolve();

    window.speechSynthesis.speak(u);
  });
}

// ------------------------------------------------------------
// Core playback
// ------------------------------------------------------------

/**
 * Plays a file. If it's missing and `fallback` text is given,
 * speaks that instead.
 */
export function play(
  src: string,
  fallback?: string,
  opts?: SpeakOptions
): Promise<void> {
  // Already known to be absent — skip straight to speech.
  if (missing.has(src)) {
    return fallback ? speak(fallback, opts) : Promise.resolve();
  }

  return new Promise((resolve) => {
    const el = get(src);
    if (!el) return resolve();

    const cleanup = () => {
      el.removeEventListener('ended', onEnd);
      el.removeEventListener('error', onError);
    };

    const onEnd = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      missing.add(src);
      cache.delete(src);
      if (fallback) speak(fallback, opts).then(resolve);
      else resolve();
    };

    el.addEventListener('ended', onEnd);
    el.addEventListener('error', onError);

    el.currentTime = 0;
    el.play().catch(onError);
  });
}

/** Stops all audio and speech. */
export function stopAll() {
  cache.forEach((el) => {
    el.pause();
    el.currentTime = 0;
  });
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// ------------------------------------------------------------
// Convenience wrappers
// ------------------------------------------------------------

/** A single word, said normally. Falls back to speech. */
export function playWord(word: string): Promise<void> {
  const key = word.toLowerCase().replace(/[^a-z]/g, '');
  return play(`/audio/words/${key}.mp3`, word, { rate: 0.8, pitch: 1.1 });
}

// Each host gets its own pitch so TTS at least distinguishes them.
const HOST_PITCH: Record<HostChoice, number> = { maya: 1.25, alex: 0.9 };

/** A host line. Falls back to speech using the script text. */
export function playHost(host: HostChoice, clip: string): Promise<void> {
  return play(`/audio/host/${host}/${clip}.mp3`, hostLine(clip), {
    pitch: HOST_PITCH[host],
    rate: 0.92,
  });
}

/**
 * One letter sound. NO speech fallback on purpose — see the note at the
 * top of this file.
 */
export function playSound(sound: string): Promise<void> {
  return play(`/audio/sounds/${sound}.mp3`);
}

/** Plays clips back to back. */
export async function playSequence(paths: string[]): Promise<void> {
  for (const p of paths) await play(p);
}

/** Stretched-out blending for Snail Talk: /f/ ... /i/ ... /sh/ */
export async function playBlend(phonemes: string[], gap = 600): Promise<void> {
  for (let i = 0; i < phonemes.length; i++) {
    await playSound(phonemes[i]);
    if (i < phonemes.length - 1) {
      await new Promise((r) => setTimeout(r, gap));
    }
  }
}

// ------------------------------------------------------------
// Random praise / correction so it isn't the same line every time
// ------------------------------------------------------------

const COUNTS = { correct: 8, wrong: 5, encourage: 4 };

export function playPraise(host: HostChoice): Promise<void> {
  const n = 1 + Math.floor(Math.random() * COUNTS.correct);
  return playHost(host, `correct-${n}`);
}

export function playCorrection(host: HostChoice): Promise<void> {
  const n = 1 + Math.floor(Math.random() * COUNTS.wrong);
  return playHost(host, `wrong-${n}`);
}

export function playEncouragement(host: HostChoice): Promise<void> {
  const n = 1 + Math.floor(Math.random() * COUNTS.encourage);
  return playHost(host, `encourage-${n}`);
}
