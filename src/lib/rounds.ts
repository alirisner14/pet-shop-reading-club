// src/lib/rounds.ts
//
// Builds a round for whichever mini game is up next.
//
// This lives apart from the screens because both Play and Practice need
// the same rounds — Practice just throws the results away.

import {
  nextWord,
  distractorWords,
  confusableWords,
  pairsPerRound,
  type LevelPlan,
} from '@/lib/progression';
import { wordsUpToLevel, type Word } from '@/data/words';
import type { ChildWord, MiniGame } from '@/types';

/** Questions per round in the pick-one games. */
const QUESTIONS_PER_ROUND = 3;

export type Round =
  | { game: 'match_words'; words: Word[]; distractors: Word[] }
  | {
      game: 'match_spoken_word' | 'match_picture';
      questions: { target: Word; choices: Word[] }[];
    }
  | { game: 'missing_letter' | 'accessory_train'; words: Word[] }
  | { game: 'snail_talk'; words: Word[]; pool: Word[] };

/**
 * Picks N distinct words this game can actually use.
 *
 * `skip` rejects words a particular game can't work with — it keeps
 * asking for another rather than giving up, so a round doesn't come
 * back short just because the first draw was unsuitable.
 */
function pickWords(
  plan: LevelPlan,
  game: MiniGame,
  progress: ChildWord[],
  count: number,
  skip?: (w: Word) => boolean
): Word[] {
  const chosen: Word[] = [];
  const used = new Set<string>();

  // A generous attempt budget: enough to step past unsuitable words
  // without ever looping forever.
  for (let tries = 0; tries < count * 8 && chosen.length < count; tries++) {
    const w = nextWord(plan, game, progress, used);
    if (!w) break;
    used.add(w.word);
    if (skip?.(w)) continue;
    chosen.push(w);
  }
  return chosen;
}

export function buildRound(
  plan: LevelPlan,
  game: MiniGame,
  progress: ChildWord[]
): Round | null {
  const pool = wordsUpToLevel(plan.level);

  switch (game) {
    // ---------------------------------------------------------
    case 'match_words': {
      const words = pickWords(plan, game, progress, pairsPerRound(plan.level));
      if (words.length === 0) return null;

      const used = new Set(words.map((w) => w.word));
      return {
        game,
        words,
        distractors: distractorWords(plan, used, 1),
      };
    }

    // ---------------------------------------------------------
    case 'match_spoken_word': {
      const targets = pickWords(plan, game, progress, QUESTIONS_PER_ROUND);
      if (targets.length === 0) return null;

      return {
        game,
        questions: targets.map((target) => ({
          target,
          // Lookalikes, but not the very closest — telling "red" from
          // "bed" by ear alone is a different and much harder task than
          // telling them apart on the page.
          choices: confusableWords(target.word, pool, 6).slice(2, 5),
        })),
      };
    }

    // ---------------------------------------------------------
    case 'match_picture': {
      const targets = pickWords(plan, game, progress, QUESTIONS_PER_ROUND);
      if (targets.length === 0) return null;

      // Choices must also have pictures, or the row looks inconsistent.
      const picturable = pool.filter((w) => w.picture);

      return {
        game,
        questions: targets.map((target) => ({
          target,
          choices: confusableWords(target.word, picturable, 3),
        })),
      };
    }

    // ---------------------------------------------------------
    case 'missing_letter': {
      // Two-letter words make a poor puzzle — hiding one letter of "it"
      // leaves almost nothing to read.
      const words = pickWords(
        plan,
        game,
        progress,
        QUESTIONS_PER_ROUND,
        (w) => w.word.length < 3
      );
      return words.length ? { game, words } : null;
    }

    // ---------------------------------------------------------
    case 'snail_talk': {
      const targets = pickWords(plan, game, progress, QUESTIONS_PER_ROUND);
      if (targets.length === 0) return null;

      // The choice row is filled from the other decodable words, kept
      // separate from the targets so a distractor never becomes a
      // question of its own.
      return {
        game,
        words: targets,
        pool: pool.filter((w) => w.phonemes),
      };
    }

    // ---------------------------------------------------------
    case 'accessory_train': {
      // Two words is plenty — pulling a word apart takes much longer
      // than picking one off a row.
      const words = pickWords(plan, game, progress, 2);
      return words.length ? { game, words } : null;
    }
  }
}
