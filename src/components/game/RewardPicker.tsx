// src/components/game/RewardPicker.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Confetti from '@/components/game/Confetti';
import PetWithCollar, { type WornCollar } from '@/components/game/PetWithCollar';
import { playHost } from '@/lib/audio';
import {
  isCollar,
  sizeOf,
  snapPosition,
  PET_ROOM_WIDTH,
  type Reward,
} from '@/data/rewards';
import type { Pet } from '@/data/pets';
import type { HostChoice } from '@/types';

// "Pick a present" — shown over her room, with the pet standing in it.
//
// Three presents sit in a drawer at the bottom. She can tap one, or drag
// it. A tap alone doesn't place anything, so a big green arrow appears
// pointing up: the present has to be carried into the room. Dragging
// puts it exactly where she lets go, and a collar dropped on the pet is
// put on the pet.
//
// Placing it herself is deliberate. Moving something to just the right
// spot is fine-motor practice, which matters at this age.

export type PlacedItem = { id: string; reward: Reward; x: number; y: number };

export type Spot = { x: number; y: number; onPet: boolean };

/** Finger travel, in px, below which a touch counts as a tap. */
const DRAG_DISTANCE = 24;

export default function RewardPicker({
  host,
  pet,
  petName,
  rewards,
  placed,
  worn,
  onPlace,
}: {
  host: HostChoice;
  pet: Pet | null;
  petName?: string | null;
  rewards: Reward[];
  /** What is already in her room. */
  placed: PlacedItem[];
  /** The collar the pet is already wearing, if any. */
  worn: WornCollar | null;
  onPlace: (rewardKey: string, spot: Spot) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const petRef = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  // A ref as well as state: a quick flick can release before a re-render.
  const liftedRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [lifted, setLifted] = useState(false);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [landed, setLanded] = useState<{
    reward: Reward;
    spot: Spot;
    at: { x: number; y: number };
  } | null>(null);

  // Slide in a beat after mounting, so the movement is visible.
  useEffect(() => {
    const id = setTimeout(() => setOpen(true), 260);
    return () => clearTimeout(id);
  }, []);

  const accent = host === 'maya' ? '#F49AC1' : '#8895F9';
  const glass =
    host === 'maya' ? 'rgba(255, 227, 238, 0.55)' : 'rgba(136, 149, 249, 0.45)';

  function percentOf(e: React.PointerEvent) {
    const box = rootRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - box.left) / box.width) * 100,
      y: ((e.clientY - box.top) / box.height) * 100,
    };
  }

  // ---------------------------------------------------------
  // Pointer handling
  // ---------------------------------------------------------
  function down(key: string, e: React.PointerEvent) {
    if (landed) return;
    start.current = { x: e.clientX, y: e.clientY };
    setDragKey(key);
    liftedRef.current = false;
    setLifted(false);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function move(e: React.PointerEvent) {
    if (!dragKey || !start.current) return;

    const travel = Math.hypot(
      e.clientX - start.current.x,
      e.clientY - start.current.y
    );
    if (travel > DRAG_DISTANCE) {
      liftedRef.current = true;
      setLifted(true);
      setSelected(null);
    }
    if (liftedRef.current) setPointer(percentOf(e));
  }

  function up(e: React.PointerEvent) {
    if (!dragKey) return;

    const key = dragKey;
    setDragKey(null);
    setPointer(null);

    // Not carried anywhere: a tap. Point at where it should go.
    if (!liftedRef.current) {
      setSelected(key);
      playHost(host, 'drag-reward');
      return;
    }

    liftedRef.current = false;
    setLifted(false);

    const reward = rewards.find((r) => r.key === key);
    if (!reward) return;

    const at = percentOf(e);
    let spot: Spot;

    // A collar let go over the pet goes on the pet.
    const box = petRef.current?.getBoundingClientRect();
    const overPet =
      isCollar(reward) &&
      box &&
      e.clientX >= box.left &&
      e.clientX <= box.right &&
      e.clientY >= box.top &&
      e.clientY <= box.bottom;

    if (overPet && box) {
      spot = {
        x: Math.max(0, Math.min(100, ((e.clientX - box.left) / box.width) * 100)),
        y: Math.max(0, Math.min(100, ((e.clientY - box.top) / box.height) * 100)),
        onPet: true,
      };
    } else {
      spot = { ...snapPosition(reward, at.x, at.y), onPet: false };
    }

    setLanded({ reward, spot, at });
    onPlace(key, spot);
  }

  // The collar the pet shows: the one she just put on, else what it had.
  const wornNow: WornCollar | null =
    landed && landed.spot.onPet
      ? {
          image: landed.reward.image,
          label: landed.reward.label,
          x: landed.spot.x,
          y: landed.spot.y,
        }
      : worn;

  const dragged = dragKey ? rewards.find((r) => r.key === dragKey) : null;
  const drawerShown = open && !lifted && !landed;

  return (
    <div
      ref={rootRef}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      className="absolute inset-0 z-40"
      style={{ touchAction: 'none' }}
    >
      {/* Her room so far */}
      {placed.map((item) => (
        <div
          key={item.id}
          className="absolute"
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            width: `${sizeOf(item.reward)}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: Math.round(item.y),
            filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.28))',
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
        </div>
      ))}

      {/* The pet, standing exactly where it stands in the room */}
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
            collar={wornNow}
            sizes="30vw"
            priority
            className="w-full"
          />
        </div>
      )}

      {/* What she has just put down, if it isn't on the pet */}
      {landed && !landed.spot.onPet && (
        <div
          className="absolute"
          style={{
            left: `${landed.spot.x}%`,
            top: `${landed.spot.y}%`,
            width: `${sizeOf(landed.reward)}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: Math.round(landed.spot.y),
            filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.28))',
          }}
        >
          <div className="animate-pop-in">
            <Image
              src={landed.reward.image}
              alt=""
              width={400}
              height={400}
              sizes="25vw"
              className="h-auto w-full object-contain"
              draggable={false}
            />
          </div>
        </div>
      )}

      {landed && (
        <div className="pointer-events-none absolute inset-0" style={{ zIndex: 90 }}>
          <Confetti
            x={`${landed.at.x}%`}
            y={`${landed.at.y}%`}
            pieces={22}
            spread={260}
          />
        </div>
      )}

      {/* Heading */}
      <div
        className="pointer-events-none absolute inset-x-0 top-[5%] text-center"
        style={{ zIndex: 85 }}
      >
        <h2
          className="font-display text-6xl text-white"
          style={{
            WebkitTextStroke: `5px ${accent}`,
            paintOrder: 'stroke fill',
            filter: 'drop-shadow(0 5px 8px rgba(0,0,0,0.3))',
          }}
        >
          Pick a present{petName ? ` for ${petName}` : ''}!
        </h2>

        {selected && !lifted && !landed && (
          <p className="animate-pop-in font-game mt-3 inline-block rounded-full bg-white/90 px-8 py-2 text-3xl text-grape shadow-lg">
            Drag it up into the room!
          </p>
        )}
      </div>

      {/* The drawer */}
      <div
        className="absolute inset-x-0 bottom-0 transition-transform duration-500 ease-out"
        style={{
          height: '34%',
          zIndex: 80,
          transform: drawerShown ? 'translateY(0)' : 'translateY(105%)',
        }}
      >
        <div
          className="relative h-full rounded-t-[2.5rem]"
          style={{
            background: glass,
            backdropFilter: 'blur(10px)',
            borderTop: `8px solid ${accent}`,
            borderLeft: `8px solid ${accent}`,
            borderRight: `8px solid ${accent}`,
            boxShadow:
              'inset 0 6px 14px rgba(255,255,255,0.75), inset 0 -6px 16px rgba(0,0,0,0.12), 0 -12px 30px rgba(0,0,0,0.3)',
          }}
        >
          {/* A little handle, so it reads as a drawer */}
          <div
            className="absolute left-1/2 top-3 h-2 w-24 -translate-x-1/2 rounded-full"
            style={{ background: 'rgba(255,255,255,0.8)' }}
          />

          <div className="flex h-full items-center justify-center gap-8 px-8 pt-5">
            {rewards.map((reward, i) => {
              const isSelected = selected === reward.key;
              const isHeld = dragKey === reward.key && lifted;

              return (
                <button
                  key={reward.key}
                  onPointerDown={(e) => down(reward.key, e)}
                  aria-label={reward.label}
                  style={{
                    background: 'rgba(255,255,255,0.6)',
                    borderColor: isSelected
                      ? '#4CCB6E'
                      : 'rgba(255,255,255,0.95)',
                    animationDelay: `${i * 140}ms`,
                    boxShadow:
                      'inset 0 4px 10px rgba(255,255,255,0.9), inset 0 -5px 12px rgba(0,0,0,0.08), 0 8px 18px rgba(0,0,0,0.2)',
                    opacity: isHeld ? 0.3 : 1,
                    touchAction: 'none',
                    cursor: 'grab',
                  }}
                  className="animate-tile hover-hop relative h-[80%] w-[22%] rounded-[1.75rem] border-[6px] p-4 transition-colors duration-300"
                >
                  <div className="pointer-events-none relative h-full w-full">
                    <Image
                      src={reward.image}
                      alt=""
                      fill
                      sizes="22vw"
                      className="object-contain"
                      draggable={false}
                      style={{
                        filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.22))',
                      }}
                    />
                  </div>

                  {/* Tapped but not carried: show which way to go */}
                  {isSelected && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 pb-2">
                      <div className="animate-point-up">
                        <svg
                          viewBox="0 0 100 120"
                          className="h-36 w-28"
                          style={{
                            filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.35))',
                          }}
                          aria-hidden
                        >
                          <path
                            d="M50 8 L94 58 H66 V112 H34 V58 H6 Z"
                            fill="#4CCB6E"
                            stroke="#FFFFFF"
                            strokeWidth="8"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* The present following her finger */}
      {dragged && lifted && pointer && (
        <div
          className="pointer-events-none absolute"
          style={{
            left: `${pointer.x}%`,
            top: `${pointer.y}%`,
            width: `${sizeOf(dragged)}%`,
            transform: 'translate(-50%, -50%) scale(1.1)',
            zIndex: 95,
            filter: 'drop-shadow(0 14px 16px rgba(0,0,0,0.4))',
          }}
        >
          <Image
            src={dragged.image}
            alt=""
            width={400}
            height={400}
            sizes="25vw"
            className="h-auto w-full object-contain"
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}
