'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

// Placeholder — built in a later phase.
export default function Page() {
  const router = useRouter();
  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">Coming soon!</h1>
      <Button color="sky" onClick={() => router.push('/menu')}>
        Back to Menu
      </Button>
    </main>
  );
}
