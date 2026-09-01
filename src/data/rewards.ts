// src/data/rewards.ts
//
// Everything a child can earn. One present per level completed.
//
// `from` is the level at which a reward becomes available. Once
// unlocked it stays in the pool, so after level 10 she keeps drawing
// from everything she hasn't collected yet — which is what carries the
// remaining twenty levels.
//
// `kind` decides who can earn it: yarn and scratching posts for kittens,
// bones and tennis balls for puppies, everything else for both.
//
// IMPORTANT: `image` must match the filenames in public/images/rewards/.
// A broken card means a mismatch here.

import type { RewardTier } from '@/types';
import type { PetKind } from '@/data/pets';

export type RewardKind = PetKind | 'both';

export type Reward = {
  key: string;
  /** Level at which this unlocks. */
  from: number;
  kind: RewardKind;
  /** Screen-reader label. */
  label: string;
  image: string;
};

const img = (file: string) => `/images/rewards/${file}.webp`;

export const REWARDS: Reward[] = [
  // ---------------------------------------------------------
  // Level 2 — collars, and a leash for the puppies
  // ---------------------------------------------------------
  { key: 'bell_collar_blue', from: 2, kind: 'both', label: 'Blue bell collar', image: img('PetReward_BellCollar_Blue') },
  { key: 'bell_collar_pink', from: 2, kind: 'both', label: 'Pink bell collar', image: img('PetReward_BellCollar_Pink') },
  { key: 'bell_collar_brown', from: 2, kind: 'both', label: 'Brown bell collar', image: img('PetReward_BellCollar_Brown') },
  { key: 'bell_collar_purple', from: 2, kind: 'both', label: 'Purple bell collar', image: img('PetReward_BellCollar_Purple') },
  { key: 'tag_collar_black', from: 2, kind: 'both', label: 'Black tag collar', image: img('PetReward_TagCollar_Black') },
  { key: 'tag_collar_brown', from: 2, kind: 'both', label: 'Brown tag collar', image: img('PetReward_TagCollar_Brown') },
  { key: 'tag_collar_blue', from: 2, kind: 'both', label: 'Blue tag collar', image: img('PetReward_TagCollar_Blue') },
  { key: 'tag_collar_pink', from: 2, kind: 'both', label: 'Pink tag collar', image: img('PetReward_TagCollar_Pink') },
  { key: 'tag_collar_purple', from: 2, kind: 'both', label: 'Purple tag collar', image: img('PetReward_TagCollar_Purple') },
  { key: 'leash_green', from: 2, kind: 'puppy', label: 'Green leash', image: img('PuppyReward_Leash_Green') },
  { key: 'leash_purple', from: 2, kind: 'puppy', label: 'Purple leash', image: img('PuppyReward_Leash_Purple') },

  // ---------------------------------------------------------
  // Level 3 — toys
  // ---------------------------------------------------------
  { key: 'feather_toy', from: 3, kind: 'kitten', label: 'Feather toy', image: img('KittenReward_FeatherToy') },
  { key: 'mouse_blue', from: 3, kind: 'kitten', label: 'Blue toy mouse', image: img('KittenReward_Mouse_Blue') },
  { key: 'mouse_gray', from: 3, kind: 'kitten', label: 'Gray toy mouse', image: img('KittenReward_Mouse_Gray') },
  { key: 'mouse_pink', from: 3, kind: 'kitten', label: 'Pink toy mouse', image: img('KittenReward_Mouse_Pink') },
  { key: 'mouse_purple', from: 3, kind: 'kitten', label: 'Purple toy mouse', image: img('KittenReward_Mouse_Purple') },
  { key: 'yarn_green', from: 3, kind: 'kitten', label: 'Green yarn', image: img('KittenReward_Yarn_Green') },
  { key: 'yarn_orange', from: 3, kind: 'kitten', label: 'Orange yarn', image: img('KittenReward_Yarn_Orange') },
  { key: 'yarn_purple', from: 3, kind: 'kitten', label: 'Purple yarn', image: img('KittenReward_Yarn_Purple') },
  { key: 'yarn_yellow', from: 3, kind: 'kitten', label: 'Yellow yarn', image: img('KittenReward_Yarn_Yellow') },
  { key: 'ball_purple', from: 3, kind: 'puppy', label: 'Purple ball', image: img('PuppyReward_Ball_Purple') },
  { key: 'ball_red', from: 3, kind: 'puppy', label: 'Red ball', image: img('PuppyReward_Ball_Red') },
  { key: 'ball_yellow', from: 3, kind: 'puppy', label: 'Yellow ball', image: img('PuppyReward_Ball_Yellow') },

  // ---------------------------------------------------------
  // Level 4 — flowers
  // ---------------------------------------------------------
  { key: 'flowers_yellow', from: 4, kind: 'both', label: 'Yellow flowers', image: img('RewardFlowers_Yellow') },
  { key: 'flowers_white', from: 4, kind: 'both', label: 'White flowers', image: img('RewardFlowers_White') },

  // ---------------------------------------------------------
  // Level 5 — beds
  // ---------------------------------------------------------
  { key: 'bed_blue', from: 5, kind: 'both', label: 'Blue bed', image: img('PetReward_Bed_Blue') },
  { key: 'bed_green', from: 5, kind: 'both', label: 'Green bed', image: img('PetReward_Bed_Green') },
  { key: 'bed_pink', from: 5, kind: 'both', label: 'Pink bed', image: img('PetReward_Bed_Pink') },
  { key: 'bed_purple', from: 5, kind: 'both', label: 'Purple bed', image: img('PetReward_Bed_Purple') },
  { key: 'bed_tan', from: 5, kind: 'both', label: 'Tan bed', image: img('PetReward_Bed_Tan') },

  // ---------------------------------------------------------
  // Level 6 — scratching posts, bone and ball
  // ---------------------------------------------------------
  { key: 'scratch_blue', from: 6, kind: 'kitten', label: 'Blue scratching post', image: img('KittenReward_Scratch_Blue') },
  { key: 'scratch_purple', from: 6, kind: 'kitten', label: 'Purple scratching post', image: img('KittenReward_Scratch_Purple') },
  { key: 'bone', from: 6, kind: 'puppy', label: 'Bone', image: img('PuppyReward_Bone') },
  { key: 'tennis_ball', from: 6, kind: 'puppy', label: 'Tennis ball', image: img('PuppyReward_TennisBall') },

  // ---------------------------------------------------------
  // Level 7 — plants
  // ---------------------------------------------------------
  { key: 'plant_floor_1', from: 7, kind: 'both', label: 'Tall floor plant', image: img('RewardPlant_Floor_1') },
  { key: 'plant_floor_2', from: 7, kind: 'both', label: 'Leafy floor plant', image: img('RewardPlant_Floor_2') },
  { key: 'plant_hanging_rope', from: 7, kind: 'both', label: 'Hanging plant on a rope', image: img('RewardPlant_Rope') },
  { key: 'plant_hook', from: 7, kind: 'both', label: 'Plant on a hook', image: img('RewardPlant_Hook') },
  { key: 'plant_stool_1', from: 7, kind: 'both', label: 'Plant on a stool', image: img('RewardPlant_Stool_1') },
  { key: 'plant_stool_2', from: 7, kind: 'both', label: 'Little potted plant', image: img('RewardPlant_Stool_2') },

  // ---------------------------------------------------------
  // Level 8 — the big furniture
  // ---------------------------------------------------------
  { key: 'tree_blue', from: 8, kind: 'kitten', label: 'Blue cat tree', image: img('KittenReward_Tree_Blue') },
  { key: 'tree_brown', from: 8, kind: 'kitten', label: 'Brown cat tree', image: img('KittenReward_Tree_Brown') },
  { key: 'tree_pink', from: 8, kind: 'kitten', label: 'Pink cat tree', image: img('KittenReward_Tree_Pink') },
  { key: 'tree_tan', from: 8, kind: 'kitten', label: 'Tan cat tree', image: img('KittenReward_Tree_Tan') },
  { key: 'tree_scratch_pink', from: 8, kind: 'kitten', label: 'Pink cat tree with a scratching post', image: img('KittenReward_Tree_Scratch_Pink') },
  { key: 'house_blue', from: 8, kind: 'puppy', label: 'Blue dog house', image: img('PuppyReward_House_Blue') },
  { key: 'house_green', from: 8, kind: 'puppy', label: 'Green dog house', image: img('PuppyReward_House_Green') },
  { key: 'house_pink', from: 8, kind: 'puppy', label: 'Pink dog house', image: img('PuppyReward_House_Pink') },
  { key: 'house_purple', from: 8, kind: 'puppy', label: 'Purple dog house', image: img('PuppyReward_House_Purple') },

  // ---------------------------------------------------------
  // Level 9 — fish friends
  // ---------------------------------------------------------
  { key: 'friend_goldfish', from: 9, kind: 'both', label: 'A goldfish friend', image: img('RewardPet_Goldfish') },
  { key: 'friend_yellowfish', from: 9, kind: 'both', label: 'A yellow fish friend', image: img('RewardPet_YellowFish') },

  // ---------------------------------------------------------
  // Level 10 — the rest of the friends
  // ---------------------------------------------------------
  { key: 'friend_hamster', from: 10, kind: 'both', label: 'A hamster friend', image: img('RewardPet_Hamster') },
  { key: 'friend_turtle', from: 10, kind: 'both', label: 'A turtle friend', image: img('RewardPet_Turtle') },
  { key: 'friend_bird_gold', from: 10, kind: 'both', label: 'A gold bird friend', image: img('RewardPet_Bird_Gold') },
  { key: 'friend_bird_silver', from: 10, kind: 'both', label: 'A silver bird friend', image: img('RewardPet_Bird_Silver') },
];

export function rewardByKey(key: string): Reward | null {
  return REWARDS.find((r) => r.key === key) ?? null;
}

/**
 * The database stores a tier for each reward. It no longer drives what
 * gets offered — the level does — but it's a useful way to see at a
 * glance how far in something was earned.
 */
export function tierForLevel(level: number): RewardTier {
  if (level <= 3) return 'easy';
  if (level <= 5) return 'less_easy';
  if (level <= 7) return 'harder';
  return 'hardest';
}

/** Unlocked, suitable for her pet, and not already collected. */
export function availableRewards(
  level: number,
  petKind: PetKind,
  earned: Set<string>
): Reward[] {
  return REWARDS.filter(
    (r) =>
      r.from <= level &&
      (r.kind === 'both' || r.kind === petKind) &&
      !earned.has(r.key)
  );
}

/**
 * Three to choose between. Newly unlocked rewards are weighted heavily,
 * so the level she reaches usually shows her what it just opened up
 * rather than burying it among older leftovers.
 */
export function offerRewards(
  level: number,
  petKind: PetKind,
  earned: Set<string>,
  count = 3
): Reward[] {
  const pool = availableRewards(level, petKind, earned);
  if (pool.length <= count) return pool;

  const fresh = pool.filter((r) => r.from === level);
  const older = pool.filter((r) => r.from < level);

  const shuffle = <T,>(list: T[]) => [...list].sort(() => Math.random() - 0.5);

  // Lead with what this level just unlocked, then fill from the rest.
  return [...shuffle(fresh), ...shuffle(older)].slice(0, count);
}

// ------------------------------------------------------------
// How a reward sits in the room
// ------------------------------------------------------------

export type Placement = 'floor' | 'hanging' | 'free';

/**
 * Hanging plants and bird cages belong on the ceiling, furniture and
 * toys on the floor. Collars are 'free' — she can put them on the pet
 * or anywhere else she likes, which is the whole point of letting her
 * place them herself.
 */
export function placementOf(reward: Reward): Placement {
  if (reward.key === 'plant_hanging_rope' || reward.key === 'plant_hook') {
    return 'hanging';
  }
  if (reward.key.startsWith('friend_bird')) return 'hanging';
  if (reward.key.includes('collar')) return 'free';
  return 'floor';
}

/**
 * Roughly how much of the room's width an item takes up. A cat tree and
 * a ball of yarn shouldn't render at the same size.
 */
export function sizeOf(reward: Reward): number {
  const big = ['tree_', 'house_', 'scratch_', 'bed_', 'plant_floor', 'friend_'];
  const small = ['collar', 'mouse_', 'ball_', 'bone', 'tennis', 'yarn_'];

  if (big.some((p) => reward.key.startsWith(p) || reward.key.includes(p))) {
    return 20;
  }
  if (small.some((p) => reward.key.includes(p))) return 8;
  return 13; // toys, flowers, stool plants
}
