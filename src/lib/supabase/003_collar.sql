-- supabase/003_collar.sql
--
-- A collar can now be worn. When `on_pet` is true, pos_x / pos_y are
-- measured across the PET (percent of the pet's width and height), not
-- across the room — so the collar stays on its neck wherever the pet
-- appears: in the room, and during play.
--
-- Safe to run more than once.

ALTER TABLE child_rewards
  ADD COLUMN IF NOT EXISTS on_pet boolean NOT NULL DEFAULT false;
