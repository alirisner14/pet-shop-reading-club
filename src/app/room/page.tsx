// src/app/room/page.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import Loading from '@/components/ui/Loading';
import { petByKey } from '@/data/pets';
import PetWithCollar from '@/components/game/PetWithCollar';
import {
  rewardByKey,
  isCollar,
  sizeOf,
  snapPosition,
  PET_ROOM_WIDTH,
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
  const petRef = useRef<HTMLDivElement>(null);

  const [child, setChild] = useState<Child | null>(null);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [tray, setTray] = useState<{ id: string; reward: Reward }[]>([]);
  // The collar the pet is wearing. x / y are percent of the PET, not the room.
  const [worn, setWorn] = useState<Placed | null>(null);
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
      let wearing: Placed | null = null;
      const waiting: { id: string; reward: Reward }[] = [];

      for (const row of rows) {
        const reward = rewardByKey(row.reward_key);
        if (!reward) continue;

        if (row.is_placed && row.pos_x !== null && row.pos_y !== null) {
          if (row.on_pet) {
            wearing = { id: row.id, reward, x: row.pos_x, y: row.pos_y };
            continue;
          }
          out.push({ id: row.id, reward, x: row.pos_x, y: row.pos_y });
        } else {
          waiting.push({ id: row.id, reward });
        }
      }

      setChild(kid);
      setPlaced(out);
      setWorn(wearing);
      setTray(waiting);
      setLoading(false);
    }

    load();
  }, [router, supabase]);

  const snap = useCallback(
    (reward: Reward, x: number, y: number) => snapPosition(reward, x, y),
    []
  );

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

  /**
   * Picking the collar up off the pet. It becomes an ordinary item in
   * the room while she holds it; letting go over the pet puts it back.
   */
  function startWornDrag(e: React.PointerEvent) {
    if (!worn || !petRef.current) return;

    const pet = petRef.current.getBoundingClientRect();
    const room = roomRef.current!.getBoundingClientRect();

    const x = ((pet.left + (worn.x / 100) * pet.width - room.left) / room.width) * 100;
    const y = ((pet.top + (worn.y / 100) * pet.height - room.top) / room.height) * 100;

    setPlaced([...placed, { ...worn, x, y }]);
    setWorn(null);
    setDragging(worn.id);
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

  async function endDrag(e: React.PointerEvent) {
    if (!dragging) return;

    const item = placed.find((p) => p.id === dragging);
    setDragging(null);
    if (!item) return;

    // A collar let go over the pet goes on the pet.
    const box = petRef.current?.getBoundingClientRect();
    const overPet =
      isCollar(item.reward) &&
      box &&
      e.clientX >= box.left &&
      e.clientX <= box.right &&
      e.clientY >= box.top &&
      e.clientY <= box.bottom;

    if (overPet && box) {
      const rel = {
        x: Math.max(0, Math.min(100, ((e.clientX - box.left) / box.width) * 100)),
        y: Math.max(0, Math.min(100, ((e.clientY - box.top) / box.height) * 100)),
      };

      // One collar at a time: whatever was on goes back to the tray.
      if (worn) {
        setTray((t) => [...t, { id: worn.id, reward: worn.reward }]);
        await supabase
          .from('child_rewards')
          .update({ on_pet: false, is_placed: false, pos_x: null, pos_y: null })
          .eq('id', worn.id);
      }

      setPlaced((items) => items.filter((p) => p.id !== item.id));
      setWorn({ id: item.id, reward: item.reward, ...rel });

      await supabase
        .from('child_rewards')
        .update({
          on_pet: true,
          is_placed: true,
          pos_x: Math.round(rel.x * 100) / 100,
          pos_y: Math.round(rel.y * 100) / 100,
          z_index: 0,
        })
        .eq('id', item.id);
      return;
    }

    const pos = snap(item.reward, item.x, item.y);

    setPlaced((items) =>
      items.map((p) => (p.id === item.id ? { ...p, ...pos } : p))
    );

    await supabase
      .from('child_rewards')
      .update({
        on_pet: false,
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
              width: `${PET_ROOM_WIDTH}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 74,
              filter: 'drop-shadow(0 12px 14px rgba(0,0,0,0.3))',
            }}
          >
            <PetWithCollar
              ref={petRef}
              pet={pet}
              priority
              sizes="30vw"
              className="w-full"
              collar={
                worn
                  ? {
                      image: worn.reward.image,
                      label: worn.reward.label,
                      x: worn.x,
                      y: worn.y,
                    }
                  : null
              }
              onCollarPointerDown={startWornDrag}
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
      {placed.length === 0 && tray.length === 0 && !worn && (
        <p className="font-game absolute inset-x-0 top-8 z-[65] text-center text-3xl text-white drop-shadow-lg">
          Finish a level to earn something for your room!
        </p>
      )}
    </main>
  );
}
