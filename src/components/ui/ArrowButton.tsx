// src/components/ui/ArrowButton.tsx
'use client';

// The chunky blue arrow used for stepping through anything — speech
// bubbles, the pet carousel. Drawn as a shape rather than a text glyph
// so it stays solid and readable at any size.

export default function ArrowButton({
  direction,
  onClick,
  disabled = false,
  label,
  size = 74,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  disabled?: boolean;
  label: string;
  size?: number;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="transition-transform active:scale-90 disabled:opacity-25"
    >
      <svg
        width={size}
        height={size * 0.7}
        viewBox="0 0 74 52"
        style={{
          transform: direction === 'left' ? 'scaleX(-1)' : undefined,
          filter: 'drop-shadow(0 4px 5px rgba(0,0,0,0.3))',
        }}
      >
        <path
          d="M4 18 H42 V6 L70 26 L42 46 V34 H4 Z"
          fill="#57A9F5"
          stroke="#ffffff"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M8 21 H44"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
