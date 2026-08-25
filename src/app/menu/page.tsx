// src/app/menu/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import Loading from '@/components/ui/Loading';
import type { Child, HostChoice } from '@/types';

const HOSTS: { key: HostChoice; name: string; avatar: string }[] = [
  { key: 'maya', name: 'Maya', avatar: '/images/hosts/maya/maya-avatar.png' },
  { key: 'alex', name: 'Alex', avatar: '/images/hosts/alex/alex-avatar.png' },
];

export default function MenuPage() {
  const router = useRouter();
  const supabase = createClient();

  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const id = localStorage.getItem('activeChildId');
      if (!id) {
        router.replace('/profiles');
        return;
      }

      const { data } = await supabase
        .from('children')
        .select('*')
        .eq('id', id)
        .single();

      if (!data) {
        localStorage.removeItem('activeChildId');
        router.replace('/profiles');
        return;
      }

      setChild(data);
      setLoading(false);
    }
    load();
  }, [router, supabase]);

  async function chooseHost(host: HostChoice) {
    if (!child) return;
    setChild({ ...child, host });
    await supabase.from('children').update({ host }).eq('id', child.id);
  }

  if (loading || !child) {
    return <Loading />;
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      {/* Background art — title upper-left, shop lower-left */}
      <Image
        src="/images/screens/menu-bg.webp"
        alt=""
        fill
        sizes="100vw"
        priority
        className="object-cover"
      />

      {/* Back to the profile picker */}
      <button
        onClick={() => router.push('/profiles')}
        aria-label="Back"
        className="absolute left-5 top-5 z-20 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/80 text-4xl shadow-lg transition-transform active:scale-90"
      >
        ←
      </button>

      {/* Everything lives in the right half, matching the mockup */}
      <div className="absolute inset-y-0 right-0 z-10 flex w-1/2 flex-col items-center justify-center gap-8 px-6">
        <p
          className="font-display text-6xl leading-none"
          style={{
            color: '#f1f3f4',
            WebkitTextStroke: '3px #aab5c3',
            paintOrder: 'stroke fill',
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.28))',
          }}
        >
          Hi, {child.first_name}!
        </p>

        {/* Host avatars — tap to pick or switch at any time */}
        <div className="flex gap-10">
          {HOSTS.map((host) => {
            const chosen = child.host === host.key;
            return (
              <button
                key={host.key}
                onClick={() => chooseHost(host.key)}
                aria-label={host.name}
                className={`
                  relative h-44 w-44 overflow-hidden rounded-full border-[8px] shadow-xl
                  transition-all duration-150 active:scale-95
                  ${chosen
                    ? 'border-rose scale-110 bg-white/25'
                    : 'border-white/60 bg-white/10 opacity-70'}
                `}
              >
                <Image
                  src={host.avatar}
                  alt={host.name}
                  fill
                  sizes="176px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>

        {/* Menu buttons stay locked until a host is chosen */}
        <div className="flex w-full max-w-lg flex-col gap-6">
          <MenuButton
            label="Play Game"
            disabled={!child.host}
            onClick={() => router.push('/play')}
          />
          <MenuButton
            label="Practice"
            disabled={!child.host}
            onClick={() => router.push('/practice')}
          />
          {child.pet_key && (
            <MenuButton label="My Room" onClick={() => router.push('/room')} />
          )}
        </div>

        {!child.host && (
          <p className="font-game text-3xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
            Pick a friend to start!
          </p>
        )}
      </div>
    </main>
  );
}

// Wide pill button styled to match the mockup.
function MenuButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="
        w-full rounded-full border-4 border-white/80 bg-sky/55 px-12 py-6
        text-6xl leading-none text-rose
        shadow-lg backdrop-blur-sm
        transition-transform duration-100 active:scale-95
        disabled:opacity-40 disabled:active:scale-100
      "
    >
      {label}
    </button>
  );
}
