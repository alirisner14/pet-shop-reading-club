// src/app/practice/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import GameStage from '@/components/game/GameStage';
import HostReaction, { type Reaction } from '@/components/host/HostReaction';
import Loading from '@/components/ui/Loading';
import PetSprite from '@/components/game/PetSprite';
import { planLevel, unlockedGames, type LevelPlan } from '@/lib/progression';
import { buildRound, type Round } from '@/lib/rounds';
import { petByKey } from '@/data/pets';
import { playHost } from '@/lib/audio';
import type { Child, ChildWord, MiniGame } from '@/types';

// Practice
//
// The same games, with the scoring taken out. Nothing is saved, no
// level moves, no meter fills, and no present waits at the end.
//
// That sounds like less of a game, and it is — deliberately. A child who
// is worried about losing progress plays cautiously, and a child who
// wants to mess about with a game she likes shouldn't have to risk her
// level to do it. Practice is where she can get things wrong for free.
//
// She picks the game rather than it rotating, because choosing is most
// of the appeal.

const GAME_NAMES: Record<MiniGame, string> = {
  match_words: 'Match the Words',
  match_spoken_word: 'Listen and Find',
  match_picture: 'Word and Picture',
  missing_letter: 'Missing Letter',
  snail_talk: 'Snail Talk',
  accessory_train: 'Sound Beds',
};

const GAME_ICONS: Record<MiniGame, string> = {
  match_words: '🧶',
  match_spoken_word: '🔊',
  match_picture: '🖼️',
  missing_letter: '🔤',
  snail_talk: '🐌',
  accessory_train: '🛏️',
};

export default function PracticePage() {
  const router = useRouter();
  const supabase = createClient();

  const [child, setChild] = useState<Child | null>(null);
  const [plan, setPlan] = useState<LevelPlan | null>(null);
  const [game, setGame] = useState<MiniGame | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [streak, setStreak] = useState(0);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [loading, setLoading] = useState(true);

  const loaded = useRef(false);
  const progressRef = useRef<ChildWord[]>([]);

  // ---------------------------------------------------------
  // Load
  // ---------------------------------------------------------
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    async function load() {
      const id = localStorage.getItem('activeChildId');
      if (!id) {
        router.replace('/profiles');
        return;
      }

      const [{ data: kid }, { data: words }] = await Promise.all([
        supabase.from('children').select('*').eq('id', id).single(),
        supabase.from('child_words').select('*').eq('child_id', id),
      ]);

      if (!kid || !kid.host) {
        router.replace('/menu');
        return;
      }

      progressRef.current = words ?? [];
      setChild(kid);
      setPlan(planLevel(kid.current_level, progressRef.current));
      setLoading(false);

      playHost(kid.host, 'practice-start');
    }

    load();
  }, [router, supabase]);

  useEffect(() => {
    if (!reaction) return;
    const id = setTimeout(() => setReaction(null), 2200);
    return () => clearTimeout(id);
  }, [reaction]);

  // ---------------------------------------------------------
  // Playing
  // ---------------------------------------------------------
  const start = useCallback(
    (pick: MiniGame) => {
      if (!plan) return;
      const built = buildRound(plan, pick, progressRef.current);
      if (!built) return;
      setGame(pick);
      setRound(built);
    },
    [plan]
  );

  /**
   * Answers still drive the host's reactions — the encouragement is half
   * of why she enjoys it — but nothing is written down.
   */
  function handleAnswer(_word: string, correct: boolean, firstTry: boolean) {
    if (correct && firstTry) {
      const run = streak + 1;
      setStreak(run);
      if (run % 3 === 0) {
        setReaction(run % 6 === 0 ? 'thumbsup' : 'excited');
      }
    } else if (!correct) {
      setStreak(0);
    }
  }

  function handleRoundDone() {
    if (!plan || !game) return;
    // Straight into another round of the same game.
    setRound(buildRound(plan, game, progressRef.current));
  }

  // Which games have enough words to be playable right now. Worked out
  // once per level — buildRound samples at random, so running it on
  // every render would churn needlessly.
  //
  // This sits above the loading check because hooks have to run in the
  // same order every render, early return or not.
  const available = useMemo(() => {
    if (!plan) return [];
    return unlockedGames(plan.level).filter((g) =>
      buildRound(plan, g, progressRef.current)
    );
  }, [plan]);

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  if (loading || !child || !child.host || !plan) return <Loading />;

  const background = child.pet_taken_home
    ? `/images/screens/room-${child.host}.webp`
    : '/images/screens/pet-shop-bg.webp';

  const accent = child.host === 'maya' ? '#F49AC1' : '#8895F9';

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <Image
        src={background}
        alt=""
        fill
        sizes="100vw"
        priority
        className="object-cover"
      />

      {/* Back — straight out, since there's nothing to lose */}
      <button
        onClick={() => (game ? setGame(null) : router.push('/menu'))}
        aria-label={game ? 'Choose another game' : 'Back to menu'}
        className="absolute right-6 top-6 z-50 flex h-20 w-20 items-center justify-center rounded-full border-[6px] border-white bg-white/90 text-5xl leading-none text-rose shadow-2xl transition-transform active:scale-90"
        style={{
          boxShadow:
            'inset 0 3px 8px rgba(255,255,255,0.8), inset 0 -4px 10px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.3)',
        }}
      >
        {game ? '↩' : '×'}
      </button>

      {/* Game picker */}
      {!game && (
        <>
          <div className="pointer-events-none absolute inset-x-[7%] inset-y-[7%] z-0 rounded-[2.5rem] border-[6px] border-white bg-white/30 shadow-2xl backdrop-blur-[3px]" />

          <div className="absolute inset-x-[7%] inset-y-[7%] z-10 flex flex-col items-center justify-center gap-10 px-8">
            <h1
              className="font-display text-7xl text-white"
              style={{
                WebkitTextStroke: `5px ${accent}`,
                paintOrder: 'stroke fill',
                filter: 'drop-shadow(0 5px 8px rgba(0,0,0,0.3))',
              }}
            >
              What shall we play?
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-7">
              {available.map((g, i) => (
                <button
                  key={g}
                  onClick={() => start(g)}
                  style={{
                    background: 'rgba(255,255,255,0.65)',
                    borderColor: 'rgba(255,255,255,0.95)',
                    animationDelay: `${i * 110}ms`,
                    boxShadow:
                      'inset 0 4px 10px rgba(255,255,255,0.9), inset 0 -5px 12px rgba(0,0,0,0.10), 0 10px 22px rgba(0,0,0,0.22)',
                  }}
                  className="animate-tile hover-hop flex h-44 w-56 flex-col items-center justify-center gap-3 rounded-[1.75rem] border-[6px] backdrop-blur-md transition-transform duration-200 active:scale-95"
                >
                  <span className="text-6xl">{GAME_ICONS[g]}</span>
                  <span className="font-game text-2xl text-grape">
                    {GAME_NAMES[g]}
                  </span>
                </button>
              ))}
            </div>

            <p className="font-game text-2xl text-white drop-shadow-lg">
              Practice as much as you like — nothing counts here!
            </p>
          </div>
        </>
      )}

      {/* Playing */}
      {game && (
        <>
          <div className="pointer-events-none absolute inset-x-[7%] inset-y-[7%] z-0 rounded-[2.5rem] border-[6px] border-white bg-white/30 shadow-2xl backdrop-blur-[3px]" />

          <div className="absolute inset-x-[7%] inset-y-[7%] z-10">
            {round ? (
              <GameStage
                round={round}
                host={child.host}
                pet={petByKey(child.pet_key)}
                petName={child.pet_name}
                onAnswer={handleAnswer}
                onRoundDone={handleRoundDone}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="font-game rounded-3xl bg-white/90 px-10 py-8 text-3xl">
                  Nothing to practice here yet!
                </p>
              </div>
            )}
          </div>

          {child.pet_key && petByKey(child.pet_key) && (
            <div className="pointer-events-none absolute bottom-[6%] right-[1%] z-20 h-[30%] w-[18%]">
              <PetSprite
                pet={petByKey(child.pet_key)!}
                sizes="20vw"
                className="h-full w-full"
              />
            </div>
          )}

          <HostReaction host={child.host} reaction={reaction} />
        </>
      )}
    </main>
  );
}
