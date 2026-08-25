// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// Display font — the default everywhere. Headings, menus, buttons, and
// the big words in gameplay.
//   public/fonts/DaisyBouquet.otf
const daisyBouquet = localFont({
  src: '../../public/fonts/DaisyBouquet.otf',
  variable: '--font-display',
  display: 'swap',
});

// Body font for smaller gameplay text — instructions, speech bubbles,
// names. Applied with the .font-game class.
//   public/fonts/Melody.otf
const melody = localFont({
  src: '../../public/fonts/Melody.otf',
  variable: '--font-game',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Pet Shop Reading Club',
  description: 'Learn to read with pets!',
};

// Stops iPad zooming when a small hand double-taps the screen.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${daisyBouquet.variable} ${melody.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
