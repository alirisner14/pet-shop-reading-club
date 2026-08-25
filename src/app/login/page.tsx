'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

// Grown-ups only. Children never see this page — they land on
// /profiles and just tap their name.
export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setBusy(true);
    setMessage('');

    const { error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (mode === 'signup') {
      setMessage('Account created! Check your email if confirmation is on, then sign in.');
      setMode('signin');
      return;
    }

    router.push('/profiles');
    router.refresh();
  }

  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-4xl font-bold">
        {mode === 'signin' ? 'Grown-Up Sign In' : 'Create an Account'}
      </h1>

      <div className="flex w-full max-w-sm flex-col gap-4">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-2xl border-4 border-peach bg-white px-5 py-4 text-xl outline-none focus:border-rose"
        />

        <input
          type="password"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-2xl border-4 border-peach bg-white px-5 py-4 text-xl outline-none focus:border-rose"
        />

        <Button
          onClick={handleSubmit}
          disabled={busy || !email || password.length < 6}
          color="rose"
        >
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </Button>

        {message && (
          <p className="rounded-xl bg-peach/60 px-4 py-3 text-center text-lg">
            {message}
          </p>
        )}

        <button
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setMessage('');
          }}
          className="text-lg underline opacity-70"
        >
          {mode === 'signin'
            ? 'Need an account? Sign up'
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </main>
  );
}
