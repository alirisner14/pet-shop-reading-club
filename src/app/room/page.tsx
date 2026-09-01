// src/app/room/page.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import Loading from '@/components/ui/Loading';
import { petByKey } from '@/data/pets';
import PetSprite from '@/components/game/PetSprite';
import {
  rewardByKey,
  placementOf,
  sizeOf,
  type Reward,
} from '@/data/rewards';
import type { Child, ChildReward } from '@/types';

// The pet's room.
//
// Everything she has earned can be dragged anywhere she likes. Snapping
// is deliberately loose — enough that a cat tree can't end up floating
// in mid-air, but not so tight that the room arranges itself. The point
// is that it's hers.
//
// Positions are stored as percentages, so the room looks the same on a
// laptop and a tablet.

// Where things settle, as a percentage down the screen.
const FLOOR_MIN = 62;
const FLOOR_MAX = 88;
const CEILING_MIN = 3;
const CEILING_MAX = 20;

type Placed = {
  id: string;
  reward: Reward;
  x: number;
  y: number;
};

export default function RoomPage() {
  const router = useRouter();
  const supabase = createClient();

  const roomRef = useRef<HTMLDivElement>(null);

  const [child, setChild] = useState<Child | null>(null);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [tray, setTray] = useState<{ id: string; reward: Reward }[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loaded = useRef(false);

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

      const [{ data: kid }, { data: prizes }] = await Promise.all([
        supabase.from('children').select('*').eq('id', id).single(),
        supabase.from('child_rewards').select('*').eq('child_id', id),
      ]);

      if (!kid || !kid.pet_key) {
        router.replace('/menu');
        return;
      }

      const rows = (prizes ?? []) as ChildReward[];

      const out: Placed[] = [];
      const waiting: { id: string; reward: Reward }[] = [];

      for (const row of rows) {
        const reward = rewardByKey(row.reward_key);
        if (!reward) continue;

        if (row.is_placed && row.pos_x !== null && row.pos_y !== null) {
          out.push({ id: row.id, reward, x: row.pos_x, y: row.pos_y });
        } else {
          waiting.push({ id: row.id, reward });
        }
      }

      setChild(kid);
      setPlaced(out);
      setTray(waiting);
      setLoading(false);
    }

    load();
  }, [router, supabase]);

  // ---------------------------------------------------------
  // Snapping
  // ---------------------------------------------------------
  const snap = useCallback((reward: Reward, x: number, y: number) => {
    const where = placementOf(reward);

    // Keep everything on screen.
    let nx = Math.max(4, Math.min(96, x));
    let ny = y;

    if (where === 'floor') {
      ny = Math.max(FLOOR_MIN, Math.min(FLOOR_MAX, y));
    } else if (where === 'hanging') {
      ny = Math.max(CEILING_MIN, Math.min(CEILING_MAX, y));
    } else {
      ny = Math.max(4, Math.min(94, y)); // collars go anywhere
    }

    return { x: nx, y: ny };
  }, []);

  // ---------------------------------------------------------
  // Dragging
  // ---------------------------------------------------------
  function pointToPercent(e: React.PointerEvent) {
    const box = roomRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - box.left) / box.width) * 100,
      y: ((e.clientY - box.top) / box.height) * 100,
    };
  }

  function startDrag(id: string, e: React.PointerEvent) {
    setDragging(id);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  /** Pulling something out of the tray places it and keeps dragging. */
  function startFromTray(id: string, e: React.PointerEvent) {
    const item = tray.find((t) => t.id === id);
    if (!item) return;

    const { x, y } = pointToPercent(e);
    const pos = snap(item.reward, x, y);

    setTray(tray.filter((t) => t.id !== id));
    setPlaced([...placed, { id, reward: item.reward, ...pos }]);
    setDragging(id);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function moveDrag(e: React.PointerEvent) {
    if (!dragging) return;
    const { x, y } = pointToPercent(e);

    setPlaced((items) =>
      items.map((item) =>
        item.id === dragging ? { ...item, x, y } : item
      )
    );
  }

  async function endDrag() {
    if (!dragging) return;

    const item = placed.find((p) => p.id === dragging);
    setDragging(null);
    if (!item) return;

    const pos = snap(item.reward, item.x, item.y);

    setPlaced((items) =>
      items.map((p) => (p.id === item.id ? { ...p, ...pos } : p))
    );

    await supabase
      .from('child_rewards')
      .update({
        is_placed: true,
        pos_x: pos.x,
        pos_y: pos.y,
        z_index: Math.round(pos.y),
      })
      .eq('id', item.id);
  }

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  if (loading || !child || !child.host) return <Loading />;

  const pet = petByKey(child.pet_key);

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <div
        ref={roomRef}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="absolute inset-0"
        style={{ touchAction: 'none' }}
      >
        <Image
          src={`/images/screens/room-${child.host}.webp`}
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />

        {/* Everything she's placed. Items lower on screen sit in front,
            which is enough to read as depth without a real 3D sort. */}
        {placed.map((item) => {
          const width = sizeOf(item.reward);
          const isDragging = dragging === item.id;

          return (
            <button
              key={item.id}
              onPointerDown={(e) => startDrag(item.id, e)}
              aria-label={item.reward.label}
              className="absolute transition-transform duration-150"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                width: `${width}%`,
                transform: `translate(-50%, -50%) scale(${isDragging ? 1.1 : 1})`,
                zIndex: isDragging ? 60 : Math.round(item.y),
                touchAction: 'none',
                filter: isDragging
                  ? 'drop-shadow(0 14px 16px rgba(0,0,0,0.4))'
                  : 'drop-shadow(0 8px 10px rgba(0,0,0,0.28))',
                cursor: 'grab',
              }}
            >
              <Image
                src={item.reward.image}
                alt=""
                width={400}
                height={400}
                sizes="25vw"
                className="h-auto w-full object-contain"
                draggable={false}
              />
            </button>
          );
        })}

        {/* The pet. Sits in the middle of the floor and stays put. */}
        {pet && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: '50%',
              top: '74%',
              width: '26%',
              transform: 'translate(-50%, -50%)',
              zIndex: 74,
              filter: 'drop-shadow(0 12px 14px rgba(0,0,0,0.3))',
            }}
          >
            <PetSprite
              pet={pet}
              priority
              sizes="30vw"
              className="aspect-square w-full"
            />
          </div>
        )}
      </div>

      {/* Back to the menu */}
      <button
        onClick={() => router.push('/menu')}
        aria-label="Back to menu"
        className="absolute left-6 top-6 z-[70] flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/85 text-4xl text-grape shadow-xl transition-transform active:scale-90"
      >
        ←
      </button>

      {/* New presents waiting to be put somewhere */}
      {tray.length > 0 && (
        <div className="absolute inset-x-0 bottom-0 z-[65] flex items-center gap-4 overflow-x-auto border-t-4 border-white bg-white/70 px-6 py-3 backdrop-blur-md">
          <p className="font-game shrink-0 text-2xl text-grape">
            Drag these into your room:
          </p>

          {tray.map((item) => (
            <button
              key={item.id}
              onPointerDown={(e) => startFromTray(item.id, e)}
              aria-label={item.reward.label}
              className="hover-hop h-24 w-24 shrink-0 rounded-2xl border-4 border-white bg-white/80 p-2 shadow-lg"
              style={{ touchAction: 'none', cursor: 'grab' }}
            >
              <Image
                src={item.reward.image}
                alt=""
                width={120}
                height={120}
                className="h-full w-full object-contain"
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}

      {/* Nothing earned yet */}
      {placed.length === 0 && tray.length === 0 && (
        <p className="font-game absolute inset-x-0 top-8 z-[65] text-center text-3xl text-white drop-shadow-lg">
          Finish a level to earn something for your room!
        </p>
      )}
    </main>
  );
}
