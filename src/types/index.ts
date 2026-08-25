// TypeScript versions of the database tables.
// These let VS Code catch typos before you ever run the app.

export type HostChoice = 'maya' | 'alex';

export type EducatorRole = 'parent' | 'teacher';

export type MiniGame =
  | 'match_words'
  | 'match_spoken_word'
  | 'match_picture'
  | 'missing_letter'
  | 'snail_talk'
  | 'accessory_train';

export type RewardTier = 'easy' | 'less_easy' | 'harder' | 'hardest';

export type Educator = {
  id: string;
  email: string;
  display_name: string | null;
  role: EducatorRole;
  created_at: string;
};

export type Child = {
  id: string;
  educator_id: string;
  first_name: string;
  avatar_color: string | null;
  host: HostChoice | null;
  pet_key: string | null;
  pet_adopted_at: string | null;
  pet_taken_home: boolean;
  current_level: number;
  meter_fill: number;
  seen_intros: string[];
  created_at: string;
  updated_at: string;
  last_played_at: string | null;
};

export type ChildWord = {
  id: string;
  child_id: string;
  word: string;
  game: MiniGame;
  level_added: number;
  correct_count: number;
  wrong_count: number;
  is_mastered: boolean;
  mastered_at: string | null;
  last_seen_at: string | null;
  updated_at: string;
};

export type ChildReward = {
  id: string;
  child_id: string;
  reward_key: string;
  tier: RewardTier;
  earned_at: string;
  earned_level: number | null;
  is_placed: boolean;
  pos_x: number | null;
  pos_y: number | null;
  z_index: number;
};
