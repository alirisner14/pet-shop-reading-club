// src/components/ui/ExitModal.tsx
'use client';

// Shown when the X is tapped mid-game. Progress is already saved after
// every answer, so neither choice can lose anything.
//
// A note on "Quit": a web page can't close its own tab unless a script
// opened it, so this returns to the title screen instead. Actually
// closing the app means closing the tab.

export default function ExitModal({
  onMenu,
  onQuit,
  onCancel,
}: {
  onMenu: () => void;
  onQuit: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/45"
      onClick={onCancel}
    >
      <div
        className="animate-pop-in flex flex-col items-center gap-7 rounded-[2.5rem] border-8 border-white bg-white/95 px-16 py-12 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-display text-6xl text-rose">All done?</p>
        <p className="font-game -mt-3 text-2xl text-grape">
          Your progress is saved.
        </p>

        <div className="mt-2 flex gap-6">
          <button
            onClick={onMenu}
            className="font-display rounded-full border-4 border-white bg-sky px-12 py-6 text-4xl text-white shadow-xl transition-transform active:scale-95"
            style={{
              boxShadow:
                'inset 0 4px 10px rgba(255,255,255,0.5), inset 0 -5px 12px rgba(0,0,0,0.14), 0 10px 22px rgba(0,0,0,0.25)',
            }}
          >
            Menu
          </button>

          <button
            onClick={onQuit}
            className="font-display rounded-full border-4 border-white bg-rose px-12 py-6 text-4xl text-white shadow-xl transition-transform active:scale-95"
            style={{
              boxShadow:
                'inset 0 4px 10px rgba(255,255,255,0.5), inset 0 -5px 12px rgba(0,0,0,0.14), 0 10px 22px rgba(0,0,0,0.25)',
            }}
          >
            Quit
          </button>
        </div>

        <button
          onClick={onCancel}
          className="font-game mt-1 text-2xl text-ink/50 underline"
        >
          Keep playing
        </button>
      </div>
    </div>
  );
}
