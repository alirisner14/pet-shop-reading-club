// src/lib/progression.ts
//
// The rules of the game, kept away from anything on screen.
//
// The shape of a level:
//   - 5 NEW words, each of which must be answered correctly in half the
//     unlocked games (rounded up)
//   - 10 OLD words drawn at random from everything learned so far,
//     spread across the unlocked games; 8 of the 10 must be right
//
// Because the old words are SAMPLED rather than exhausted, a level costs
// roughly the same whether it's level 3 or level 28. Requiring every old
// word every time would have meant ~600 correct answers by level 20.
//
// Which old words get drawn is weighted by how shaky they are, so a word
// she has nailed ten times over barely shows up, and one she keeps
// missing comes straight back.

import type { ChildWord, MiniGame } from '@/types';
import { wordsUpToLevel, wordsAtLevel, type Word } from '@/data/words';

// ------------------------------------------------------------
// Tunable numbers — all in one place
// ------------------------------------------------------------

/** Clean first-try answers needed before a word counts as mastered in a game. */
export const MASTERY_TARGET = 2;

/** New words introduced per level. */
export const NEW_PER_LEVEL = 5;

/** Old words drawn for review each level. */
export const REVIEW_DRAW = 10;

/** How many of those must be right to pass. */
export const REVIEW_PASS = 8;

/** Wrong attempts on one pair before the game just shows the answer. */
export const MAX_ATTEMPTS = 2;

/** Correct answers that fill the meter from empty to full. */
export const METER_TARGET = 10;

/** Level from which an extra unmatchable tile is added to the board. */
export const DISTRACTOR_FROM_LEVEL = 3;

// ------------------------------------------------------------
// Which games are in play
// ------------------------------------------------------------

// A new game every two levels. Match to Spoken Word is in from the very
// start — it's the one she likes best, and it's the core sight-word skill.
const UNLOCKS: { from: number; game: MiniGame }[] = [
  { from: 1, game: 'match_words' },
  { from: 1, game: 'match_spoken_word' },
  { from: 3, game: 'missing_letter' },
  { from: 5, game: 'match_picture' },
  { from: 7, game: 'snail_talk' },
  { from: 9, game: 'accessory_train' },
];

export function unlockedGames(level: number): MiniGame[] {
  return UNLOCKS.filter((u) => level >= u.from).map((u) => u.game);
}

/** The game that has just become available at this level, if any. */
export function newlyUnlocked(level: number): MiniGame | null {
  const fresh = UNLOCKS.filter((u) => u.from === level);
  return fresh.length ? fresh[fresh.length - 1].game : null;
}

/** Games a given word can actually appear in. */
export function gamesForWord(word: Word, level: number): MiniGame[] {
  return unlockedGames(level).filter((g) => {
    if (g === 'match_picture') return !!word.picture;
    if (g === 'snail_talk' || g === 'accessory_train') return !!word.phonemes;
    return true;
  });
}

/** How many games a new word must be mastered in — half, rounded up. */
export function requiredGamesFor(word: Word, level: number): number {
  const possible = gamesForWord(word, level).length;
  return Math.max(1, Math.ceil(possible / 2));
}

// ------------------------------------------------------------
// Word strength
// ------------------------------------------------------------

/**
 * How solid a word is, across every game. Higher means she knows it.
 * Wrong answers count double — one miss undoes two hits, because a word
 * she gets wrong is more informative than one she gets right.
 */
export function strengthOf(word: string, progress: ChildWord[]): number {
  const rows = progress.filter((p) => p.word === word);
  const right = rows.reduce((n, r) => n + r.correct_count, 0);
  const wrong = rows.reduce((n, r) => n + r.wrong_count, 0);
  return right - wrong * 2;
}

/**
 * Draw weight for review. Strong words fall away fast but never quite
 * reach zero, so nothing is gone forever.
 */
function reviewWeight(strength: number): number {
  return 1 / (1 + Math.max(0, strength) ** 1.5);
}

/** Picks `count` words at random, favouring the shaky ones. */
export function weightedSample(
  pool: Word[],
  progress: ChildWord[],
  count: number
): Word[] {
  const remaining = [...pool];
  const picked: Word[] = [];

  while (picked.length < count && remaining.length > 0) {
    const weights = remaining.map((w) =>
      reviewWeight(strengthOf(w.word, progress))
    );
    const total = weights.reduce((a, b) => a + b, 0);

    let roll = Math.random() * total;
    let index = 0;
    while (index < weights.length - 1 && roll > weights[index]) {
      roll -= weights[index];
      index++;
    }

    picked.push(remaining[index]);
    remaining.splice(index, 1);
  }

  return picked;
}

// ------------------------------------------------------------
// Building a level
// ------------------------------------------------------------

export type LevelPlan = {
  level: number;
  games: MiniGame[];
  /** The 5 words introduced this level. */
  newWords: Word[];
  /** The 10 older words drawn for review. */
  reviewWords: Word[];
};

export function planLevel(level: number, progress: ChildWord[]): LevelPlan {
  const newWords = wordsAtLevel(level);

  const older = wordsUpToLevel(level - 1);
  const reviewWords = weightedSample(older, progress, REVIEW_DRAW);

  return {
    level,
    games: unlockedGames(level),
    newWords,
    reviewWords,
  };
}

// ------------------------------------------------------------
// Has the level been passed?
// ------------------------------------------------------------

/** Games in which this word has been mastered. */
function masteredGameCount(word: string, progress: ChildWord[]): number {
  return progress.filter((p) => p.word === word && p.is_mastered).length;
}

export type LevelStatus = {
  newDone: number;
  newNeeded: number;
  reviewRight: number;
  reviewNeeded: number;
  passed: boolean;
};

export function levelStatus(
  plan: LevelPlan,
  progress: ChildWord[]
): LevelStatus {
  // New words: mastered in at least half their possible games.
  const newDone = plan.newWords.filter(
    (w) =>
      masteredGameCount(w.word, progress) >= requiredGamesFor(w, plan.level)
  ).length;

  // Review words: one clean answer this level is enough.
  const reviewRight = plan.reviewWords.filter(
    (w) => strengthOf(w.word, progress) > 0
  ).length;

  const newNeeded = plan.newWords.length;
  const reviewNeeded = Math.min(REVIEW_PASS, plan.reviewWords.length);

  return {
    newDone,
    newNeeded,
    reviewRight,
    reviewNeeded,
    passed: newDone >= newNeeded && reviewRight >= reviewNeeded,
  };
}

// ------------------------------------------------------------
// Choosing what to show next
// ------------------------------------------------------------

/**
 * The next word for a given game. New words come first, then whichever
 * review word is shakiest.
 */
export function nextWord(
  plan: LevelPlan,
  game: MiniGame,
  progress: ChildWord[],
  exclude: Set<string> = new Set()
): Word | null {
  const eligible = (w: Word) =>
    !exclude.has(w.word) && gamesForWord(w, plan.level).includes(game);

  const forGame = new Map(
    progress.filter((p) => p.game === game).map((p) => [p.word, p])
  );

  // 1. New words not yet mastered in this game.
  const fresh = plan.newWords
    .filter(eligible)
    .filter((w) => !forGame.get(w.word)?.is_mastered);
  if (fresh.length) return fresh[Math.floor(Math.random() * fresh.length)];

  // 2. Review words, shakiest first.
  const review = plan.reviewWords
    .filter(eligible)
    .sort(
      (a, b) => strengthOf(a.word, progress) - strengthOf(b.word, progress)
    );
  if (review.length) return review[0];

  // 3. Anything at all, so the game never runs dry.
  const any = wordsUpToLevel(plan.level).filter(eligible);
  return any.length ? any[Math.floor(Math.random() * any.length)] : null;
}

/**
 * Extra words that pair with nothing, so the last tile on the board is
 * never guaranteed to be the right one. Guessing by elimination stops
 * paying off.
 */
export function distractorWords(
  plan: LevelPlan,
  used: Set<string>,
  count: number
): Word[] {
  if (plan.level < DISTRACTOR_FROM_LEVEL || count <= 0) return [];

  const pool = wordsUpToLevel(plan.level).filter((w) => !used.has(w.word));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ------------------------------------------------------------
// Odds and ends
// ------------------------------------------------------------

export function meterPercent(correctCount: number): number {
  return Math.min(100, Math.round((correctCount / METER_TARGET) * 100));
}

export function rewardTier(
  level: number
): 'easy' | 'less_easy' | 'harder' | 'hardest' {
  if (level <= 7) return 'easy';
  if (level <= 15) return 'less_easy';
  if (level <= 23) return 'harder';
  return 'hardest';
}
