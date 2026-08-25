'use client';

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  color?: 'rose' | 'sky' | 'mint' | 'lavender' | 'sunshine';
  size?: 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit';
};

// Big, chunky, high-contrast. Sized for a five-year-old's finger,
// not a mouse pointer.
const COLORS = {
  rose:     'bg-rose text-white',
  sky:      'bg-sky text-ink',
  mint:     'bg-mint text-ink',
  lavender: 'bg-lavender text-white',
  sunshine: 'bg-sunshine text-ink',
};

const SIZES = {
  md: 'text-2xl px-8 py-4 min-h-[64px]',
  lg: 'text-4xl px-12 py-6 min-h-[88px]',
};

export default function Button({
  children,
  onClick,
  color = 'rose',
  size = 'md',
  disabled = false,
  type = 'button',
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${COLORS[color]} ${SIZES[size]}
        rounded-3xl font-bold shadow-lg
        border-4 border-white/60
        transition-transform duration-100
        active:scale-95
        disabled:opacity-40 disabled:active:scale-100
      `}
    >
      {children}
    </button>
  );
}
