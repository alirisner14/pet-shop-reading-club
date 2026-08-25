// src/app/play/page.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import MatchWords from '@/components/minigames/MatchWords';
import MatchWordsDemo from '@/components/minigames/MatchWordsDemo';
import RewardMeter from '@/components/game/RewardMeter';
import HostIntro, { WELCOME_STEPS, gameStep } from '@/components/host/HostIntro';
import HostReaction, { type Reaction } from '@/components/host/HostReaction';
import HostAnimation from '@/components/host/HostAnimation';
import Loading from '@/components/ui/Loading';
import ExitModal from '@/components/ui/ExitModal';
import Confetti from '@/components/game/Confetti';
import {
  planLevel,
  levelStatus,
  nextWord,
  distractorWords,
  meterPercent,
  METER_TARGET,
  MASTERY_TARGET,
  type LevelPlan,
} from '@/lib/progression';
import { MAX_LEVEL } from '@/data/words';
import { playHost } from '@/lib/audio';
import type { Child, ChildWord } from '@/types';
import type { Word } from '@/data/words';

type Phase = 'welcome' | 'game-intro' | 'playing' | 'meter-full' | 'level-up';

const METER_CUE_STEP = 2;
const PAIRS_PER_ROUND = 3;
const REACTION_EVERY = 3;

export default function PlayPage() {
  const router = useRouter();
  const supabase = createClient();

  const [child, setChild] = useState<Child | null>(null);
  const [plan, setPlan] = useState<LevelPlan | null>(null);
  const [round, setRound] = useState<Word[]>([]);
  const [extras, setExtras] = useState<Word[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>('playing');
  const [meterVisible, setMeterVisible] = useState(false);
  const [demoMeter, setDemoMeter] = useState<number | null>(null);
  const [exiting, setExiting] = useState(false);

  const loaded = useRef(false);
  const progressRef = useRef<ChildWord[]>([]);

  /** Builds the next set of pairs, plus any unmatchable extras. */
  const buildRound = useCallback((p: LevelPlan) => {
    const chosen: Word[] = [];
    const used = new Set<string>();

    for (let i = 0; i < PAIRS_PER_ROUND; i++) {
      const w = nextWord(p, 'match_words', progressRef.current, used);
      if (!w) break;
      used.add(w.word);
      chosen.push(w);
    }

    setRound(chosen);
    setExtras(distractorWords(p, used, 1));
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

      const [{ data: kid }, { data: words }] = await Promise.all([
        supabase.from('children').select('*').eq('id', id).single(),
        supabase.from('child_words').select('*').eq('child_id', id),
      ]);

      if (!kid || !kid.host) {
        router.replace('/menu');
        return;
      }

      progressRef.current = words ?? [];
      const p = planLevel(kid.current_level, progressRef.current);

      setChild(kid);
      setPlan(p);
      buildRound(p);

      const seenWelcome = kid.seen_intros.includes('welcome');
      const seenGame = kid.seen_intros.includes('match_words');

      if (!seenWelcome) setPhase('welcome');
      else if (!seenGame) {
        setPhase('game-intro');
        setMeterVisible(true);
      } else {
        setPhase('playing');
        setMeterVisible(true);
      }

      setLoading(false);
    }

    load();
  }, [router, supabase, buildRound]);

  useEffect(() => {
    if (!reaction) return;
    const id = setTimeout(() => setReaction(null), 2200);
    return () => clearTimeout(id);
  }, [reaction]);

  // ---------------------------------------------------------
  // Intro bookkeeping
  // ---------------------------------------------------------
  const markSeen = useCallback(
    async (key: string) => {
      if (!child || child.seen_intros.includes(key)) return;
      const seen = [...child.seen_intros, key];
      setChild({ ...child, seen_intros: seen });
      await supabase
        .from('children')
        .update({ seen_intros: seen })
        .eq('id', child.id);
    },
    [child, supabase]
  );

  async function finishWelcome() {
    await markSeen('welcome');
    setDemoMeter(null);
    setMeterVisible(true);
    setPhase(
      child?.seen_intros.includes('match_words') ? 'playing' : 'game-intro'
    );
  }

  async function finishGameIntro() {
    await markSeen('match_words');
    setPhase('playing');
  }

  // ---------------------------------------------------------
  // One pair attempted
  //
  // Only a clean first attempt earns credit. A word worked out after a
  // miss still completes the pair, but doesn't move her forward — which
  // is what stops guess-until-it-works from being a viable strategy.
  // ---------------------------------------------------------
  async function handleAnswer(
    wordText: string,
    correct: boolean,
    firstTry: boolean
  ) {
    if (!child || !plan) return;

    const w = [...plan.newWords, ...plan.reviewWords].find(
      (x) => x.word === wordText
    );
    if (!w) return;

    const prog = progressRef.current;
    const existing = prog.find(
      (p) => p.word === wordText && p.game === 'match_words'
    );

    // A right answer only counts if it was the first attempt.
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
          game: 'match_words' as const,
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
        ...prog.filter(
          (p) => !(p.word === wordText && p.game === 'match_words')
        ),
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
        .update({
          meter_fill: meterPercent(count),
          last_played_at: new Date().toISOString(),
        })
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
      setChild({ ...child, current_level: level });
      await supabase
        .from('children')
        .update({ current_level: level })
        .eq('id', child.id);

      const nextPlan = planLevel(level, progressRef.current);
      setPlan(nextPlan);
      buildRound(nextPlan);
      setPhase('level-up');
      playHost(child.host!, 'level-complete');
      return;
    }

    if (correctCount >= METER_TARGET) {
      setPhase('meter-full');
      playHost(child.host!, 'meter-full');
      return;
    }

    buildRound(plan);
  }

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  if (loading || !child || !child.host || !plan) return <Loading />;

  const background = child.pet_taken_home
    ? `/images/screens/room-${child.host}.webp`
    : '/images/screens/pet-shop-bg.webp';

  const status = levelStatus(plan, progressRef.current);

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

      {/* Always visible, whatever phase we're in */}
      <button
        onClick={() => {
          // Straight out if she hasn't actually started yet.
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
        percent={demoMeter ?? meterPercent(correctCount)}
        host={child.host}
        visible={meterVisible}
      />

      {/* Play area */}
      {phase === 'playing' && (
        <>
          <div className="pointer-events-none absolute inset-x-[7%] inset-y-[7%] z-0 rounded-[2.5rem] border-[6px] border-white bg-white/30 shadow-2xl backdrop-blur-[3px]" />

          <div className="absolute inset-x-[7%] inset-y-[7%] z-10">
            {round.length > 0 ? (
              <MatchWords
                words={round}
                distractors={extras}
                host={child.host}
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

          {/* Quiet progress readout for a grown-up looking over a shoulder */}
          <p className="font-game absolute bottom-3 right-6 z-20 text-xl text-white/80 drop-shadow">
            Level {child.current_level} · new {status.newDone}/
            {status.newNeeded} · review {status.reviewRight}/
            {status.reviewNeeded}
          </p>
        </>
      )}

      {phase === 'playing' && reaction && (
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
          <div className="pointer-events-none absolute inset-x-[7%] inset-y-[7%] z-10">
            <MatchWordsDemo host={child.host} />
          </div>

          <HostIntro
            host={child.host}
            steps={gameStep('game-match-words')}
            variant="game"
            onDone={finishGameIntro}
          />
        </>
      )}

      {/* Level passed — she comes to the middle of the room to celebrate */}
      {phase === 'level-up' && (
        <div className="absolute inset-0 z-30 bg-black/35">
          {/* Confetti across the top of the screen */}
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
          </div>

          {/* Host, centre stage */}
          <div className="absolute bottom-0 left-1/2 h-[62%] -translate-x-1/2">
            <HostAnimation host={child.host} loops={0} className="h-full" />
          </div>

          <button
            onClick={() => setPhase('playing')}
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

      {phase === 'meter-full' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-black/35">
          <div className="animate-pop-in rounded-[2rem] border-[6px] border-white bg-white/95 px-14 py-8 text-center">
            <p className="font-display text-6xl text-rose">The meter is full!</p>
            <p className="font-game mt-2 text-2xl text-grape">
              Choosing your pet comes next.
            </p>
          </div>

          <div className="h-[36%]">
            <HostAnimation host={child.host} loops={0} className="h-full" />
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
