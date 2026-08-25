// src/app/profiles/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import type { Child } from '@/types';

const TILE_COLORS = [
  '#F49AC1',
  '#A8D8F0',
  '#7DD8A0',
  '#C7B3E8',
  '#F5C842',
  '#FFD9B8',
];

export default function ProfilesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) setError(error.message);
      else setChildren(data ?? []);

      setLoading(false);
    }
    load();
  }, [supabase]);

  async function addChild() {
    const name = newName.trim();
    if (!name) return;

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const { data, error } = await supabase
      .from('children')
      .insert({
        educator_id: auth.user.id,
        first_name: name,
        avatar_color: TILE_COLORS[children.length % TILE_COLORS.length],
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    setChildren([...children, data]);
    setNewName('');
    setAdding(false);
  }

  function pickChild(child: Child) {
    localStorage.setItem('activeChildId', child.id);
    router.push('/menu');
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <main className="flex min-h-dvh flex-col items-center gap-10 px-6 py-10">
      <h1 className="font-display text-6xl text-rose">Who&apos;s playing?</h1>

      {error && (
        <p className="rounded-xl bg-rose/20 px-4 py-2 text-lg">{error}</p>
      )}

      <div className="flex flex-wrap justify-center gap-8">
        {children.map((child) => (
          <button
            key={child.id}
            onClick={() => pickChild(child)}
            className="flex h-60 w-60 flex-col items-center justify-center rounded-[2rem] border-[6px] border-white/80 transition-transform active:scale-95"
            style={{
              backgroundColor: child.avatar_color ?? '#F49AC1',
              boxShadow:
                'inset 0 4px 12px rgba(255,255,255,0.6), inset 0 -6px 14px rgba(0,0,0,0.12), 0 10px 24px rgba(0,0,0,0.2)',
            }}
          >
            <span className="font-display text-engraved text-6xl leading-none text-white">
              {child.first_name}
            </span>
            <span className="font-game mt-3 text-3xl text-white/90">
              Level {child.current_level}
            </span>
          </button>
        ))}

        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex h-60 w-60 flex-col items-center justify-center rounded-[2rem] border-[6px] border-dashed border-ink/30 text-ink/60 transition-transform active:scale-95"
          >
            <span className="text-7xl">+</span>
            <span className="font-game text-2xl">Add</span>
          </button>
        )}
      </div>

      {adding && (
        <div className="flex w-full max-w-sm flex-col gap-4">
          <input
            autoFocus
            maxLength={30}
            placeholder="First name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addChild()}
            className="font-game rounded-2xl border-4 border-peach bg-white px-5 py-4 text-center text-3xl outline-none focus:border-rose"
          />
          <div className="flex justify-center gap-4">
            <Button onClick={addChild} color="mint" disabled={!newName.trim()}>
              Save
            </Button>
            <Button
              onClick={() => {
                setAdding(false);
                setNewName('');
              }}
              color="sky"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <button
        onClick={signOut}
        className="font-game mt-auto text-lg underline opacity-50"
      >
        Sign out
      </button>
    </main>
  );
}
