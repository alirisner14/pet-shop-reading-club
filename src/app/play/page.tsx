// src/app/play/page.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import GameStage from '@/components/game/GameStage';
import MatchWordsDemo from '@/components/minigames/MatchWordsDemo';
import RewardMeter from '@/components/game/RewardMeter';
import Confetti from '@/components/game/Confetti';
import HostIntro, { WELCOME_STEPS, gameStep } from '@/components/host/HostIntro';
import HostReaction, { type Reaction } from '@/components/host/HostReaction';
import HostAnimation from '@/components/host/HostAnimation';
import Loading from '@/components/ui/Loading';
import ExitModal from '@/components/ui/ExitModal';
import PetCarousel from '@/components/game/PetCarousel';
import RewardPicker from '@/components/game/RewardPicker';
import { petByKey } from '@/data/pets';
import PetSprite from '@/components/game/PetSprite';
import PetNaming from '@/components/game/PetNaming';
import {
  offerRewards,
  rewardByKey,
  tierForLevel,
  type Reward,
} from '@/data/rewards';
import {
  planLevel,
  levelStatus,
  MASTERY_TARGET,
  unlockedGames,
  newlyUnlocked,
  type LevelPlan,
} from '@/lib/progression';
import { buildRound, type Round } from '@/lib/rounds';
import { MAX_LEVEL, wordsUpToLevel } from '@/data/words';
import { playHost } from '@/lib/audio';
import type { Child, ChildWord, MiniGame } from '@/types';

type Phase =
  | 'welcome'
  | 'game-intro'
  | 'playing'
  | 'meter-full'
  | 'level-up'
  | 'choose-pet'
  | 'pet-chosen'
  | 'name-pet'
  | 'reward';

const METER_CUE_STEP = 2;
const REACTION_EVERY = 3;

// Which host clip explains each game.
const INTRO_CLIP: Record<MiniGame, string> = {
  match_words: 'game-match-words',
  match_spoken_word: 'game-match-spoken',
  match_picture: 'game-match-picture',
  missing_letter: 'game-missing-letter',
  snail_talk: 'game-snail-talk',
  accessory_train: 'game-accessory-train',
};

export default function PlayPage() {
  const router = useRouter();
  const supabase = createClient();

  const [child, setChild] = useState<Child | null>(null);
  const [plan, setPlan] = useState<LevelPlan | null>(null);
  const [game, setGame] = useState<MiniGame>('match_words');

  const [round, setRound] = useState<Round | null>(null);

  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>('playing');
  const [meterVisible, setMeterVisible] = useState(false);
  const [demoMeter, setDemoMeter] = useState<number | null>(null);
  const [exiting, setExiting] = useState(false);
  const [offer, setOffer] = useState<Reward[]>([]);
  const [earned, setEarned] = useState<Set<string>>(new Set());

  const loaded = useRef(false);
  const progressRef = useRef<ChildWord[]>([]);
  const gameIndex = useRef(0);

  // ---------------------------------------------------------
  // Starting a round
  // ---------------------------------------------------------

  /**
   * Picks the next game and lays out its round.
   *
   * Games rotate rather than being chosen at random, so every unlocked
   * game comes round in turn and none is left unplayed. If a game has
   * nothing it can use yet — Match to Picture before any picture words
   * are unlocked — it's skipped rather than shown empty.
   */
  const startRound = useCallback((p: LevelPlan, kid: Child) => {
    const games = unlockedGames(p.level);

    for (let attempt = 0; attempt < games.length; attempt++) {
      const next = games[gameIndex.current % games.length];
      gameIndex.current += 1;

      const built = buildRound(p, next, progressRef.current);
      if (!built) continue;

      setGame(next);
      setRound(built);
      setPhase(kid.seen_intros.includes(next) ? 'playing' : 'game-intro');
      return;
    }

    // Nothing playable at all — shouldn't happen, but don't hang.
    setRound(null);
    setPhase('playing');
  }, []);

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

      const [{ data: kid }, { data: words }, { data: prizes }] =
        await Promise.all([
          supabase.from('children').select('*').eq('id', id).single(),
          supabase.from('child_words').select('*').eq('child_id', id),
          supabase.from('child_rewards').select('reward_key').eq('child_id', id),
        ]);

      if (!kid || !kid.host) {
        router.replace('/menu');
        return;
      }

      progressRef.current = words ?? [];
      setEarned(
        new Set((prizes ?? []).map((r: { reward_key: string }) => r.reward_key))
      );
      const p = planLevel(kid.current_level, progressRef.current);

      setChild(kid);
      setPlan(p);

      if (!kid.seen_intros.includes('welcome')) {
        // Lay out a round behind the welcome, but don't show it yet.
        setGame('match_words');
        setRound(buildRound(p, 'match_words', progressRef.current));
        setPhase('welcome');
      } else {
        setMeterVisible(true);
        startRound(p, kid);
      }

      setLoading(false);
    }

    load();
  }, [router, supabase, startRound]);

  useEffect(() => {
    if (!reaction) return;
    const id = setTimeout(() => setReaction(null), 2200);
    return () => clearTimeout(id);
  }, [reaction]);

  // ---------------------------------------------------------
  // Intro bookkeeping
  // ---------------------------------------------------------
  const markSeen = useCallback(
    async (key: string): Promise<Child | null> => {
      if (!child || child.seen_intros.includes(key)) return child;
      const seen = [...child.seen_intros, key];
      const updated = { ...child, seen_intros: seen };
      setChild(updated);
      await supabase
        .from('children')
        .update({ seen_intros: seen })
        .eq('id', child.id);
      return updated;
    },
    [child, supabase]
  );

  async function finishWelcome() {
    const kid = await markSeen('welcome');
    setDemoMeter(null);
    setMeterVisible(true);
    if (kid && plan) startRound(plan, kid);
  }

  async function finishGameIntro() {
    await markSeen(game);
    setPhase('playing');
  }

  // ---------------------------------------------------------
  // One answer
  // ---------------------------------------------------------
  async function handleAnswer(
    wordText: string,
    correct: boolean,
    firstTry: boolean
  ) {
    if (!child || !plan) return;

    const w = [...plan.newWords, ...plan.reviewWords, ...wordsUpToLevel(plan.level)].find(
      (x) => x.word === wordText
    );
    if (!w) return;

    const prog = progressRef.current;
    const existing = prog.find((p) => p.word === wordText && p.game === game);

    // Only a clean first attempt earns credit.
    const scored = correct && firstTry;
    const nextCorrect = (existing?.correct_count ?? 0) + (scored ? 1 : 0);
    const nextWrong = (existing?.wrong_count ?? 0) + (correct ? 0 : 1);
    const mastered = nextCorrect >= MASTERY_TARGET;

    const { data: saved } = await supabase
      .from('child_words')
      .upsert(
        {
          child_id: child.id,
          word: wordText,
          game,
          level_added: w.level,
          correct_count: nextCorrect,
          wrong_count: nextWrong,
          is_mastered: mastered,
          mastered_at: mastered ? new Date().toISOString() : null,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'child_id,word,game' }
      )
      .select()
      .single();

    if (saved) {
      progressRef.current = [
        ...prog.filter((p) => !(p.word === wordText && p.game === game)),
        saved,
      ];
    }

    if (scored) {
      const count = correctCount + 1;
      const run = streak + 1;
      setCorrectCount(count);
      setStreak(run);

      if (run % REACTION_EVERY === 0) {
        setReaction(run % (REACTION_EVERY * 2) === 0 ? 'thumbsup' : 'excited');
      }

      await supabase
        .from('children')
        .update({ last_played_at: new Date().toISOString() })
        .eq('id', child.id);
    } else if (!correct) {
      setStreak(0);
    }
  }

  // ---------------------------------------------------------
  // Round finished
  // ---------------------------------------------------------
  async function handleRoundDone() {
    if (!child || !plan) return;

    const status = levelStatus(plan, progressRef.current);

    if (status.passed && child.current_level < MAX_LEVEL) {
      const level = child.current_level + 1;
      const kid = { ...child, current_level: level };
      setChild(kid);
      await supabase
        .from('children')
        .update({ current_level: level })
        .eq('id', child.id);

      const nextPlan = planLevel(level, progressRef.current);
      setPlan(nextPlan);
      setPhase('level-up');
      await playHost(child.host!, 'meter-full');
      playHost(child.host!, 'level-complete');
      return;
    }

    startRound(plan, child);
  }

  // ---------------------------------------------------------
  // What happens after a level is celebrated
  //
  // The very first completed level earns her the pet — that's what the
  // whole welcome promised. Every level after earns a present for it.
  // ---------------------------------------------------------
  function afterCelebration() {
    if (!child || !plan) return;

    if (!child.pet_key) {
      setPhase('choose-pet');
      playHost(child.host!, 'choose-pet');
      return;
    }

    const pet = petByKey(child.pet_key);
    if (!pet) return startRound(plan, child);

    setOffer(offerRewards(child.current_level, pet.kind, earned));
    setPhase('reward');
    playHost(child.host!, 'choose-reward');
  }

  async function claimReward(rewardKey: string) {
    if (!child || !plan) return;

    const reward = rewardByKey(rewardKey);
    if (!reward) return;

    setEarned(new Set(earned).add(rewardKey));

    await supabase.from('child_rewards').insert({
      child_id: child.id,
      reward_key: rewardKey,
      tier: tierForLevel(reward.from),
      earned_level: child.current_level - 1,
    });

    playHost(child.host!, 'reward-placed');
    startRound(plan, child);
  }

  // ---------------------------------------------------------
  // Adoption
  // ---------------------------------------------------------
  async function adoptPet(petKey: string) {
    if (!child) return;

    const updated = {
      ...child,
      pet_key: petKey,
      pet_adopted_at: new Date().toISOString(),
      pet_taken_home: true,
      meter_fill: 0,
    };

    setChild(updated);
    setPhase('pet-chosen');

    await supabase
      .from('children')
      .update({
        pet_key: petKey,
        pet_adopted_at: updated.pet_adopted_at,
        pet_taken_home: true,
        meter_fill: 0,
      })
      .eq('id', child.id);

    await playHost(child.host!, 'pet-chosen');
  }

  /** Saves the name, then heads home. */
  async function namePet(name: string) {
    if (!child || !plan) return;

    setChild({ ...child, pet_name: name });
    setPhase('playing');

    await supabase
      .from('children')
      .update({ pet_name: name })
      .eq('id', child.id);

    playHost(child.host!, 'take-home');
    startRound(plan, child);
  }

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  if (loading || !child || !child.host || !plan) return <Loading />;

  const background = child.pet_taken_home
    ? `/images/screens/room-${child.host}.webp`
    : '/images/screens/pet-shop-bg.webp';

  const status = levelStatus(plan, progressRef.current);

  // The meter IS the level. It fills as she works through the level's
  // requirements, so a full meter and a finished level are one event —
  // which is what makes a present at the top of it make sense.
  const levelTotal = status.newNeeded + status.reviewNeeded;
  const levelDone = status.newDone + status.reviewRight;
  const levelPercent =
    levelTotal === 0 ? 0 : Math.round((levelDone / levelTotal) * 100);

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

      <button
        onClick={() => {
          if (phase === 'welcome' || phase === 'game-intro') router.push('/menu');
          else setExiting(true);
        }}
        aria-label="Close"
        className="absolute right-6 top-6 z-50 flex h-20 w-20 items-center justify-center rounded-full border-[6px] border-white bg-white/90 text-6xl leading-none text-rose shadow-2xl transition-transform active:scale-90"
        style={{
          boxShadow:
            'inset 0 3px 8px rgba(255,255,255,0.8), inset 0 -4px 10px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.3)',
        }}
      >
        ×
      </button>

      {exiting && (
        <ExitModal
          onCancel={() => setExiting(false)}
          onMenu={() => router.push('/menu')}
          onQuit={() => router.push('/')}
        />
      )}

      <RewardMeter
        percent={demoMeter ?? levelPercent}
        host={child.host}
        visible={meterVisible}
      />

      {/* Play area */}
      {phase === 'playing' && (
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
                  No words available yet.
                </p>
              </div>
            )}
          </div>

          {/* The pet watches from the side while she plays */}
          {petByKey(child.pet_key) && (
            <div className="pointer-events-none absolute bottom-[6%] right-[1%] z-20 h-[30%] w-[18%]">
              <PetSprite
                pet={petByKey(child.pet_key)!}
                sizes="20vw"
                className="h-full w-full"
              />
              {child.pet_name && (
                <p className="font-game mt-1 text-center text-2xl text-white drop-shadow-lg">
                  {child.pet_name}
                </p>
              )}
            </div>
          )}

          <p className="font-game absolute bottom-3 left-6 z-20 text-xl text-white/80 drop-shadow">
            Level {child.current_level} · new {status.newDone}/
            {status.newNeeded} · review {status.reviewRight}/
            {status.reviewNeeded}
          </p>
        </>
      )}

      {phase === 'playing' && (
        <HostReaction host={child.host} reaction={reaction} />
      )}

      {phase === 'welcome' && (
        <HostIntro
          host={child.host}
          steps={WELCOME_STEPS}
          variant="welcome"
          onStep={(i) => {
            if (i >= METER_CUE_STEP) setMeterVisible(true);
            if (i < 3) setDemoMeter(0);
          }}
          onSpeak={(i) => {
            if (i === 3) setDemoMeter(50);
            if (i === 4) setDemoMeter(100);
          }}
          onDone={finishWelcome}
        />
      )}

      {phase === 'game-intro' && (
        <>
          <div className="pointer-events-none absolute inset-x-[7%] inset-y-[7%] z-0 rounded-[2.5rem] border-[6px] border-white bg-white/30 shadow-2xl backdrop-blur-[3px]" />

          {/* Match the Words plays itself behind her. The spoken-word game
              is audio-led, so a silent demo would be misleading. */}
          {game === 'match_words' && (
            <div className="pointer-events-none absolute inset-x-[7%] inset-y-[7%] z-10">
              <MatchWordsDemo host={child.host} />
            </div>
          )}

          <HostIntro
            host={child.host}
            steps={gameStep(INTRO_CLIP[game])}
            variant="game"
            onDone={finishGameIntro}
          />
        </>
      )}

      {/* Level passed */}
      {phase === 'level-up' && (
        <div className="absolute inset-0 z-30 bg-black/35">
          {['12%', '30%', '50%', '70%', '88%'].map((x, i) => (
            <Confetti
              key={x}
              x={x}
              y={`${10 + (i % 2) * 8}%`}
              pieces={22}
              spread={320}
            />
          ))}

          <div className="absolute inset-x-0 top-[8%] z-10 text-center">
            <p
              className="font-display animate-pop-in text-8xl text-white"
              style={{
                WebkitTextStroke: '5px #7DD8A0',
                paintOrder: 'stroke fill',
                filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))',
              }}
            >
              Level Complete!
            </p>
            <p className="font-game mt-4 text-4xl text-white drop-shadow-lg">
              On to level {child.current_level}
            </p>

            {/* A new game opening up is worth announcing — it's the
                thing most likely to pull her into the next level. */}
            {newlyUnlocked(child.current_level) && (
              <p className="font-game animate-pop-in mt-3 text-3xl text-sunshine drop-shadow-lg">
                A new game is unlocked!
              </p>
            )}
          </div>

          {/* Centre stage for the celebration */}
          <div className="absolute inset-0 flex items-center justify-center">
            <HostAnimation
              host={child.host}
              loops={0}
              className="h-[78%] w-[45%]"
            />
          </div>

          <button
            onClick={afterCelebration}
            className="font-display absolute bottom-10 right-10 rounded-full border-[6px] border-white bg-mint px-16 py-7 text-5xl text-white shadow-2xl transition-transform active:scale-95"
            style={{
              boxShadow:
                'inset 0 4px 10px rgba(255,255,255,0.5), inset 0 -5px 12px rgba(0,0,0,0.14), 0 12px 26px rgba(0,0,0,0.28)',
            }}
          >
            Keep going!
          </button>
        </div>
      )}

      {/* Choosing a pet */}
      {phase === 'choose-pet' && (
        <PetCarousel host={child.host} onChoose={adoptPet} />
      )}

      {/* Just adopted */}
      {phase === 'pet-chosen' && (
        <div className="absolute inset-0 z-40 bg-black/35">
          {['20%', '50%', '80%'].map((x, i) => (
            <Confetti
              key={x}
              x={x}
              y={`${14 + (i % 2) * 6}%`}
              pieces={20}
              spread={300}
            />
          ))}

          <div className="absolute inset-x-0 top-[8%] text-center">
            <p
              className="font-display animate-pop-in text-8xl text-white"
              style={{
                WebkitTextStroke: '5px #F49AC1',
                paintOrder: 'stroke fill',
                filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))',
              }}
            >
              Your new friend!
            </p>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="h-[55%] w-[45%]"
              style={{ filter: 'drop-shadow(0 14px 20px rgba(0,0,0,0.3))' }}
            >
              {petByKey(child.pet_key) && (
                <PetSprite
                  pet={petByKey(child.pet_key)!}
                  sizes="45vw"
                  className="animate-pop-in h-full w-full"
                />
              )}
            </div>
          </div>

          <button
            onClick={() => setPhase('name-pet')}
            className="font-display hover-hop absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full border-[6px] border-white bg-mint px-20 py-7 text-5xl text-white shadow-2xl transition-transform active:scale-95"
            style={{
              boxShadow:
                'inset 0 4px 10px rgba(255,255,255,0.5), inset 0 -5px 12px rgba(0,0,0,0.14), 0 12px 26px rgba(0,0,0,0.28)',
            }}
          >
            Name my pet!
          </button>
        </div>
      )}

      {phase === 'name-pet' && petByKey(child.pet_key) && (
        <PetNaming
          pet={petByKey(child.pet_key)!}
          host={child.host}
          onName={namePet}
        />
      )}

      {phase === 'reward' && (
        <RewardPicker
          host={child.host}
          pet={petByKey(child.pet_key)}
          petName={child.pet_name}
          rewards={offer}
          onChoose={claimReward}
        />
      )}

      {phase === 'meter-full' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-black/35">
          <div className="animate-pop-in rounded-[2rem] border-[6px] border-white bg-white/95 px-14 py-8 text-center">
            <p className="font-display text-6xl text-rose">The meter is full!</p>
            <p className="font-game mt-2 text-2xl text-grape">
              Choosing your pet comes next.
            </p>
          </div>

          <div className="h-[52%] w-[36%]">
            <HostAnimation host={child.host} loops={0} className="h-full w-full" />
          </div>

          <button
            onClick={() => router.push('/menu')}
            className="font-display rounded-full border-4 border-white bg-mint px-12 py-5 text-3xl text-white shadow-xl active:scale-95"
          >
            Back to Menu
          </button>
        </div>
      )}
    </main>
  );
}
