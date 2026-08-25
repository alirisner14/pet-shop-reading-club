// src/components/ui/Loading.tsx
'use client';

// The loading screen. It only flashes for a moment, but plain black text
// on cream looked like a broken page in the middle of a very colorful
// game, so it gets the same treatment as everything else.

export default function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-8">
      <h1
        className="font-display animate-bob text-7xl"
        style={{
          background:
            'linear-gradient(100deg, #F49AC1 0%, #FFC29B 22%, #FFF29B 42%, #7DD8A0 62%, #52CBFF 80%, #DB5CFF 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          filter: 'drop-shadow(0 3px 2px rgba(0,0,0,0.10))',
        }}
      >
        {label}
      </h1>

      {/* Paw prints padding across, one after another */}
      <div className="flex gap-5 text-4xl">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="animate-bob"
            style={{
              animationDelay: `${i * 180}ms`,
              opacity: 0.75,
            }}
          >
            🐾
          </span>
        ))}
      </div>
    </main>
  );
}
