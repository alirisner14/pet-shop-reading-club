// src/app/page.tsx
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Title splash. Tap anywhere to move on.
export default function SplashPage() {
  const router = useRouter();

  return (
    <main
      onClick={() => router.push('/profiles')}
      className="relative flex h-dvh w-full flex-col items-center justify-end overflow-hidden"
    >
      <Image
        src="/images/screens/title-splash.webp"
        alt="Pet Shop Reading Club"
        fill
        sizes="100vw"
        priority
        className="object-cover"
      />

      <button
        className="animate-bob relative z-10 mb-16 rounded-full border-[6px] border-white bg-rose px-20 py-8 shadow-2xl transition-transform active:scale-95"
        style={{
          boxShadow:
            'inset 0 4px 10px rgba(255,255,255,0.6), inset 0 -5px 12px rgba(0,0,0,0.14), 0 12px 26px rgba(0,0,0,0.28)',
        }}
      >
        <span className="font-display text-engraved text-7xl text-white">
          Tap to Start
        </span>
      </button>
    </main>
  );
}
