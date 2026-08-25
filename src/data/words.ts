// ============================================================
// Word lists for Pet Shop Reading Club
//
// The 150 sight words are in the SAME ORDER as her class's
// printed sheets, so the game moves at the same pace as school.
// Sheet 1 = rows 1-14, Sheet 2 = rows 15-30.
//
// Each "level" is one row of 5 words. Words from earlier levels
// stay in the rotation forever — they never drop out.
// ============================================================

export type Picture =
  | { kind: 'color'; value: string }   // a color swatch, drawn with CSS
  | { kind: 'image'; value: string };  // a file in /public/images/

export type Word = {
  word: string;
  level: number;              // which level introduces it (1-30)
  picture?: Picture;          // only words with a picture can appear in Match-to-Picture
  phonemes?: string[];        // only decodable words can appear in the sound games
};

// ------------------------------------------------------------
// SIGHT WORDS — 30 levels of 5
// ------------------------------------------------------------

export const SIGHT_WORDS: Word[] = [
  // Level 1 — colors
  { word: 'green',  level: 1, picture: { kind: 'color', value: '#4CAF50' } },
  { word: 'blue',   level: 1, picture: { kind: 'color', value: '#4A90D9' } },
  { word: 'purple', level: 1, picture: { kind: 'color', value: '#9C6ADE' } },
  { word: 'orange', level: 1, picture: { kind: 'color', value: '#F5883C' } },
  { word: 'red',    level: 1, picture: { kind: 'color', value: '#E24A4A' } },

  // Level 2 — colors
  { word: 'white',  level: 2, picture: { kind: 'color', value: '#FFFFFF' } },
  { word: 'yellow', level: 2, picture: { kind: 'color', value: '#F5C842' } },
  { word: 'black',  level: 2, picture: { kind: 'color', value: '#2B2B2B' } },
  { word: 'pink',   level: 2, picture: { kind: 'color', value: '#F49AC1' } },
  { word: 'brown',  level: 2, picture: { kind: 'color', value: '#8B5E3C' } },

  // Level 3
  { word: 'the', level: 3 },
  { word: 'am',  level: 3, phonemes: ['a', 'm'] },
  { word: 'I',   level: 3 },
  { word: 'in',  level: 3, phonemes: ['i', 'n'] },
  { word: 'on',  level: 3, phonemes: ['o', 'n'] },

  // Level 4
  { word: 'see', level: 4 },
  { word: 'if',  level: 4, phonemes: ['i', 'f'] },
  { word: 'at',  level: 4, phonemes: ['a', 't'] },
  { word: 'it',  level: 4, phonemes: ['i', 't'] },
  { word: 'a',   level: 4 },

  // Level 5
  { word: 'no',  level: 5 },
  { word: 'up',  level: 5, phonemes: ['u', 'p'] },
  { word: 'his', level: 5 },
  { word: 'us',  level: 5, phonemes: ['u', 's'] },
  { word: 'is',  level: 5 },

  // Level 6
  { word: 'has', level: 6, phonemes: ['h', 'a', 's'] },
  { word: 'go',  level: 6 },
  { word: 'had', level: 6, phonemes: ['h', 'a', 'd'] },
  { word: 'as',  level: 6 },
  { word: 'so',  level: 6 },

  // Level 7
  { word: 'can', level: 7, phonemes: ['c', 'a', 'n'] },
  { word: 'me',  level: 7 },
  { word: 'an',  level: 7, phonemes: ['a', 'n'] },
  { word: 'got', level: 7, phonemes: ['g', 'o', 't'] },
  { word: 'and', level: 7, phonemes: ['a', 'n', 'd'] },

  // Level 8
  { word: 'be',  level: 8 },
  { word: 'not', level: 8, phonemes: ['n', 'o', 't'] },
  { word: 'he',  level: 8 },
  { word: 'she', level: 8 },
  { word: 'we',  level: 8 },

  // Level 9
  { word: 'to',   level: 9 },
  { word: 'by',   level: 9 },
  { word: 'are',  level: 9 },
  { word: 'my',   level: 9 },
  { word: 'look', level: 9 },

  // Level 10
  { word: 'like', level: 10 },
  { word: 'do',   level: 10 },
  { word: 'why',  level: 10 },
  { word: 'here', level: 10 },
  { word: 'good', level: 10 },

  // Level 11
  { word: 'play', level: 11 },
  { word: 'for',  level: 11 },
  { word: 'say',  level: 11 },
  { word: 'of',   level: 11 },
  { word: 'day',  level: 11 },

  // Level 12
  { word: 'or',   level: 12 },
  { word: 'give', level: 12 },
  { word: 'have', level: 12 },
  { word: 'live', level: 12 },
  { word: 'you',  level: 12 },

  // Level 13
  { word: 'him',  level: 13, phonemes: ['h', 'i', 'm'] },
  { word: 'with', level: 13 },
  { word: 'they', level: 13 },
  { word: 'will', level: 13 },
  { word: 'down', level: 13 },

  // Level 14
  { word: 'her',   level: 14 },
  { word: 'these', level: 14 },
  { word: 'said',  level: 14 },
  { word: 'did',   level: 14, phonemes: ['d', 'i', 'd'] },
  { word: 'was',   level: 14 },

  // ---------- Sheet 2 ----------

  // Level 15
  { word: 'come',  level: 15 },
  { word: 'there', level: 15 },
  { word: 'that',  level: 15 },
  { word: 'saw',   level: 15 },
  { word: 'then',  level: 15 },

  // Level 16
  { word: 'where', level: 16 },
  { word: 'all',   level: 16 },
  { word: 'who',   level: 16 },
  { word: 'some',  level: 16 },
  { word: 'this',  level: 16 },

  // Level 17
  { word: 'get',  level: 17, phonemes: ['g', 'e', 't'] },
  { word: 'new',  level: 17 },
  { word: 'were', level: 17 },
  { word: 'our',  level: 17 },
  { word: 'what', level: 17 },

  // Level 18
  { word: 'would', level: 18 },
  { word: 'out',   level: 18 },
  { word: 'could', level: 18 },
  { word: 'went',  level: 18 },
  { word: 'over',  level: 18 },

  // Level 19
  { word: 'how',  level: 19 },
  { word: 'time', level: 19 },
  { word: 'make', level: 19 },
  { word: 'each', level: 19 },
  { word: 'know', level: 19 },

  // Level 20
  { word: 'yes',   level: 20, phonemes: ['y', 'e', 's'] },
  { word: 'now',   level: 20 },
  { word: 'your',  level: 20 },
  { word: 'love',  level: 20 },
  { word: 'about', level: 20 },

  // Level 21
  { word: 'only', level: 21 },
  { word: 'part', level: 21 },
  { word: 'when', level: 21 },
  { word: 'put',  level: 21 },
  { word: 'use',  level: 21 },

  // Level 22
  { word: 'from',  level: 22 },
  { word: 'after', level: 22 },
  { word: 'their', level: 22 },
  { word: 'which', level: 22 },
  { word: 'but',   level: 22, phonemes: ['b', 'u', 't'] },

  // Level 23
  { word: 'off',    level: 23 },
  { word: 'nice',   level: 23 },
  { word: 'one',    level: 23 },
  { word: 'little', level: 23 },
  { word: 'may',    level: 23 },

  // Level 24
  { word: 'call',   level: 24 },
  { word: 'way',    level: 24 },
  { word: 'pretty', level: 24 },
  { word: 'very',   level: 24 },
  { word: 'two',    level: 24 },

  // Level 25
  { word: 'four',  level: 25 },
  { word: 'more',  level: 25 },
  { word: 'house', level: 25, picture: { kind: 'image', value: 'rewards/PuppyReward_House_Blue.webp' } },
  { word: 'six',   level: 25 },
  { word: 'night', level: 25 },

  // Level 26
  { word: 'eight',  level: 26 },
  { word: 'them',   level: 26 },
  { word: 'friend', level: 26 },
  { word: 'ten',    level: 26 },
  { word: 'three',  level: 26 },

  // Level 27
  { word: 'take',   level: 27 },
  { word: 'people', level: 27 },
  { word: 'number', level: 27 },
  { word: 'word',   level: 27 },
  { word: 'into',   level: 27 },

  // Level 28
  { word: 'great',   level: 28 },
  { word: 'zero',    level: 28 },
  { word: 'because', level: 28 },
  { word: 'nine',    level: 28 },
  { word: 'other',   level: 28 },

  // Level 29
  { word: 'many',   level: 29 },
  { word: 'seven',  level: 29 },
  { word: 'much',   level: 29 },
  { word: 'before', level: 29 },
  { word: 'any',    level: 29 },

  // Level 30
  { word: 'favorite', level: 30 },
  { word: 'right',    level: 30 },
  { word: 'five',     level: 30 },
  { word: 'want',     level: 30 },
  { word: 'most',     level: 30 },
];

// ------------------------------------------------------------
// THEME WORDS — pet shop words that already have artwork.
// These carry the picture and sound games, since most sight
// words are abstract ("the", "was") and can't be drawn.
// Mixed into levels alongside the sight words.
// ------------------------------------------------------------

export const THEME_WORDS: Word[] = [
  { word: 'cat',    level: 1,  picture: { kind: 'image', value: 'pets/Kitten_OrangeTabby.webp' },        phonemes: ['c', 'a', 't'] },
  { word: 'dog',    level: 1,  picture: { kind: 'image', value: 'pets/Puppy_GoldenRetriever.webp' },     phonemes: ['d', 'o', 'g'] },
  { word: 'bed',    level: 2,  picture: { kind: 'image', value: 'rewards/PetReward_Bed_Blue.webp' },     phonemes: ['b', 'e', 'd'] },
  { word: 'ball',   level: 2,  picture: { kind: 'image', value: 'rewards/PuppyReward_Ball_Red.webp' } },
  { word: 'bone',   level: 3,  picture: { kind: 'image', value: 'rewards/PuppyReward_Bone.webp' } },
  { word: 'fish',   level: 4,  picture: { kind: 'image', value: 'rewards/RewardPet_Goldfish.webp' },     phonemes: ['f', 'i', 'sh'] },
  { word: 'bird',   level: 5,  picture: { kind: 'image', value: 'rewards/RewardPet_Bird_Gold.webp' } },
  { word: 'pet',    level: 6,  phonemes: ['p', 'e', 't'] },
  { word: 'mouse',  level: 7,  picture: { kind: 'image', value: 'rewards/KittenReward_Mouse_Gray.webp' } },
  { word: 'tree',   level: 8,  picture: { kind: 'image', value: 'rewards/KittenReward_Tree_Brown.webp' } },
  { word: 'turtle', level: 9,  picture: { kind: 'image', value: 'rewards/RewardPet_Turtle.webp' } },
  { word: 'leash',  level: 10, picture: { kind: 'image', value: 'rewards/PuppyReward_Leash_Purple.webp' } },
];

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

export const ALL_WORDS: Word[] = [...SIGHT_WORDS, ...THEME_WORDS];

export const MAX_LEVEL = 30;

/** Every word available at this level — earlier levels stay in rotation. */
export function wordsUpToLevel(level: number): Word[] {
  return ALL_WORDS.filter((w) => w.level <= level);
}

/** Just the new words introduced at this level. */
export function wordsAtLevel(level: number): Word[] {
  return ALL_WORDS.filter((w) => w.level === level);
}

/** Words that can appear in Match-to-Picture. */
export function pictureWords(level: number): Word[] {
  return wordsUpToLevel(level).filter((w) => w.picture);
}

/** Words that can appear in Snail Talk and Accessory Train. */
export function soundWords(level: number): Word[] {
  return wordsUpToLevel(level).filter((w) => w.phonemes);
}

/** Filename-safe key for a word's audio clip, e.g. "I" -> "i". */
export function audioKey(word: string): string {
  return word.toLowerCase().replace(/[^a-z]/g, '');
}
