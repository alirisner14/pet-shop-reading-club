// src/components/game/RewardMeter.tsx
'use client';

import type { HostChoice } from '@/types';

// The pet food meter, drawn entirely in CSS.
//
// No images, so there is nothing to misalign and nothing to load. A
// silver casing with a glass tube down the middle; the fill rises and
// changes color as it climbs, so progress reads at a glance even from
// across the room.

const STAGES: Record<HostChoice, string[]> = {
  // Maya — soft pastels
  maya: ['#FFC2D3', '#FFC29B', '#52CBFF', '#DB5CFF', '#F49AC1'],
  // Alex — brighter, higher contrast
  alex: ['#8895F9', '#7DF376', '#FFF731', '#52CBFF', '#D80041'],
};

export default function RewardMeter({
  percent,
  host,
  visible = true,
}: {
  percent: number;
  host: HostChoice;
  visible?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, percent));

  // Five bands, one per notch on the scale.
  const stages = STAGES[host];
  const band = Math.min(stages.length - 1, Math.floor(clamped / 20));
  const color = stages[band];
  const full = clamped >= 100;

  return (
    <div
      className={`pointer-events-none absolute left-4 top-1/2 z-20 flex transition-transform duration-700 ease-out ${
        visible
          ? '-translate-y-1/2 translate-x-0'
          : '-translate-y-1/2 -translate-x-[150%]'
      }`}
      style={{ height: '46%' }}
      role="img"
      aria-label={`Pet food meter, ${clamped} percent full`}
    >
      {/* Silver casing */}
      <div
        className="relative flex h-full items-center rounded-[1.5rem] px-3 py-4"
        style={{
          width: 92,
          background:
            'linear-gradient(145deg, #FDFDFE 0%, #C9CFD6 22%, #EEF1F4 46%, #AEB6BF 72%, #E4E8EC 100%)',
          boxShadow:
            'inset 0 2px 4px rgba(255,255,255,0.95), inset 0 -3px 8px rgba(0,0,0,0.22), 0 10px 24px rgba(0,0,0,0.3)',
          border: '2px solid rgba(255,255,255,0.7)',
        }}
      >
        {/* Paw badge on the cap */}
        <div
          className="absolute left-1/2 top-1 -translate-x-1/2 text-lg leading-none"
          style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }}
        >
          🐾
        </div>

        {/* Glass tube */}
        <div
          className="relative mt-5 h-[calc(100%-1.75rem)] w-9 overflow-hidden rounded-full"
          style={{
            background:
              'linear-gradient(180deg, rgba(226,232,238,0.95), rgba(200,208,216,0.95))',
            boxShadow:
              'inset 2px 0 5px rgba(0,0,0,0.28), inset -2px 0 5px rgba(0,0,0,0.18), inset 0 3px 6px rgba(0,0,0,0.25)',
          }}
        >
          {/* The fill */}
          <div
            className="absolute inset-x-0 bottom-0 transition-[height,background] duration-700 ease-out"
            style={{
              height: `${clamped}%`,
              background: `linear-gradient(180deg, ${color} 0%, ${color} 62%, rgba(0,0,0,0.16) 100%)`,
              borderTopLeftRadius: '999px',
              borderTopRightRadius: '999px',
              boxShadow: `0 -2px 10px ${color}, inset 0 3px 6px rgba(255,255,255,0.55)`,
            }}
          >
            {/* A soft crest so it reads as a level, not a bar */}
            <div
              className="absolute inset-x-0 top-0 h-2 rounded-full"
              style={{ background: 'rgba(255,255,255,0.65)' }}
            />
          </div>

          {/* Glass highlight down the left */}
          <div
            className="pointer-events-none absolute inset-y-0 left-1 w-2 rounded-full"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.15))',
            }}
          />
        </div>

        {/* Scale */}
        <div className="ml-2 mt-5 flex h-[calc(100%-1.75rem)] flex-col justify-between py-1">
          {[5, 4, 3, 2, 1, 0].map((n) => (
            <div key={n} className="flex items-center gap-1">
              <span
                className="block rounded-full"
                style={{
                  width: n % 1 === 0 ? 9 : 5,
                  height: 2,
                  background: 'rgba(40,45,52,0.75)',
                }}
              />
              <span
                className="text-[11px] font-bold leading-none"
                style={{ color: 'rgba(40,45,52,0.8)' }}
              >
                {n}
              </span>
            </div>
          ))}
        </div>

        {/* DONE! lights up at the top */}
        <span
          className="absolute right-1 top-3 text-[9px] font-bold tracking-wide transition-colors"
          style={{
            color: full ? '#2FA85C' : 'rgba(40,45,52,0.45)',
            textShadow: full ? '0 0 8px rgba(47,168,92,0.8)' : 'none',
          }}
        >
          DONE!
        </span>
      </div>

      {full && (
        <div className="animate-pop-in absolute inset-0 rounded-[1.5rem] ring-8 ring-sunshine/70" />
      )}
    </div>
  );
}
