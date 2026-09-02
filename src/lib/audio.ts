// src/lib/audio.ts
//
// All sound playback goes through here, and — importantly — through a
// single queue. Nothing ever plays over anything else.
//
// That matters more than it sounds. A five-year-old can't separate two
// voices: if Maya says "great job!" while the next word is spoken, she
// hears neither. Sounds now wait their turn.
//
// Every call tries the recorded MP3 first. If the file isn't there yet,
// it falls back to the browser's built-in speech, so the game stays
// playable while recordings are still being made. Drop a file into
// public/audio/ and it takes over automatically.
//
// One deliberate exception: individual letter SOUNDS never fall back to
// speech. Ask a TTS voice for /f/ and it says "eff", which would teach
// the wrong thing.

import type { HostChoice } from '@/types';
import { hostLine } from '@/data/hostScripts';

const cache = new Map<string, HTMLAudioElement>();
const missing = new Set<string>(); // paths already known to 404

type SpeakOptions = { pitch?: number; rate?: number };

type Job = {
  src: string;
  fallback?: string;
  opts?: SpeakOptions;
  resolve: () => void;
};

// ------------------------------------------------------------
// The queue
// ------------------------------------------------------------

let queue: Job[] = [];
let active: Job | null = null;
let current: HTMLAudioElement | null = null;

/** Anything beyond this waits; older waiting items are dropped. */
const MAX_PENDING = 2;

function enqueue(
  src: string,
  fallback?: string,
  opts?: SpeakOptions,
  interrupt = false
): Promise<void> {
  return new Promise((resolve) => {
    const job: Job = { src, fallback, opts, resolve };

    if (interrupt) {
      // Clear anything waiting and cut off what's playing.
      queue.forEach((j) => j.resolve());
      queue = [];
      hardStop();
      active = null;
    }

    queue.push(job);

    // Don't let a burst of taps build a backlog.
    while (queue.length > MAX_PENDING) {
      const dropped = queue.shift();
      dropped?.resolve();
    }

    if (!active) next();
  });
}

function next() {
  const job = queue.shift();
  if (!job) {
    active = null;
    return;
  }

  active = job;
  run(job).then(() => {
    job.resolve();
    next();
  });
}

function hardStop() {
  if (current) {
    current.pause();
    current.currentTime = 0;
    current = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/** Plays one job to completion. */
function run(job: Job): Promise<void> {
  if (missing.has(job.src)) {
    return job.fallback ? speakNow(job.fallback, job.opts) : Promise.resolve();
  }

  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve();

    let el = cache.get(job.src);
    if (!el) {
      el = new Audio(job.src);
      el.preload = 'auto';
      cache.set(job.src, el);
    }

    current = el;

    const cleanup = () => {
      el!.removeEventListener('ended', onEnd);
      el!.removeEventListener('error', onError);
      if (current === el) current = null;
    };

    const onEnd = () => {
      cleanup();
      resolve();
    };

    const onError = () => {
      cleanup();
      missing.add(job.src);
      cache.delete(job.src);
      if (job.fallback) speakNow(job.fallback, job.opts).then(resolve);
      else resolve();
    };

    el.addEventListener('ended', onEnd);
    el.addEventListener('error', onError);

    el.currentTime = 0;
    el.play().catch(onError);
  });
}

/** Stops everything and empties the queue. */
export function stopAll() {
  queue.forEach((j) => j.resolve());
  queue = [];
  active = null;
  hardStop();
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

function pickVoice(): SpeechSynthesisVoice | null {
  if (voices.length === 0) loadVoices();

  const english = voices.filter((v) => v.lang.startsWith('en'));
  if (english.length === 0) return null;

  return (
    english.find((v) => /google/i.test(v.name)) ??
    english.find((v) => /natural/i.test(v.name)) ??
    english.find((v) => v.localService) ??
    english[0]
  );
}

function speakNow(text: string, opts: SpeakOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !text) {
      return resolve();
    }

    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) u.voice = voice;

    u.pitch = opts.pitch ?? 1.1;
    u.rate = opts.rate ?? 0.9;
    u.onend = () => resolve();
    u.onerror = () => resolve();

    window.speechSynthesis.speak(u);
  });
}

/** Speaks text directly, queued like everything else. */
export function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  return enqueue('', text, opts);
}

// ------------------------------------------------------------
// Convenience wrappers
// ------------------------------------------------------------

/** A single word, said normally. */
export function playWord(word: string): Promise<void> {
  const key = word.toLowerCase().replace(/[^a-z]/g, '');
  return enqueue(`/audio/words/${key}.mp3`, word, { rate: 0.8, pitch: 1.1 });
}

/** Same, but cuts off whatever is playing — for a replay button. */
export function playWordNow(word: string): Promise<void> {
  const key = word.toLowerCase().replace(/[^a-z]/g, '');
  return enqueue(
    `/audio/words/${key}.mp3`,
    word,
    { rate: 0.8, pitch: 1.1 },
    true
  );
}

const HOST_PITCH: Record<HostChoice, number> = { maya: 1.25, alex: 0.9 };

/** A host line. Waits its turn. */
export function playHost(host: HostChoice, clip: string): Promise<void> {
  return enqueue(`/audio/host/${host}/${clip}.mp3`, hostLine(clip), {
    pitch: HOST_PITCH[host],
    rate: 0.92,
  });
}

/** A host line that interrupts — the speaker button in a speech bubble. */
export function playHostNow(host: HostChoice, clip: string): Promise<void> {
  return enqueue(
    `/audio/host/${host}/${clip}.mp3`,
    hostLine(clip),
    { pitch: HOST_PITCH[host], rate: 0.92 },
    true
  );
}

/** One letter sound. No speech fallback — see the note at the top. */
export function playSound(sound: string): Promise<void> {
  return enqueue(`/audio/sounds/${sound}.mp3`);
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
// Random praise / correction, so it isn't the same line every time
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
