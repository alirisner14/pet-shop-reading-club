// src/components/game/GameStage.tsx
'use client';

import MatchWords from '@/components/minigames/MatchWords';
import MatchSpokenWord from '@/components/minigames/MatchSpokenWord';
import MatchPicture from '@/components/minigames/MatchPicture';
import MissingLetter from '@/components/minigames/MissingLetter';
import SnailTalk from '@/components/minigames/SnailTalk';
import AccessoryTrain from '@/components/minigames/AccessoryTrain';
import type { Round } from '@/lib/rounds';
import type { Pet } from '@/data/pets';
import type { HostChoice } from '@/types';

// Renders whichever mini game the round calls for.
//
// Both Play and Practice go through here, so a new game only has to be
// wired up once. Every game reports the same way — word, correct, and
// whether it was a clean first attempt — which is what lets Practice
// simply discard what Play saves.

type Props = {
  round: Round;
  host: HostChoice;
  pet: Pet | null;
  petName?: string | null;
  onAnswer: (word: string, correct: boolean, firstTry: boolean) => void;
  onRoundDone: () => void;
};

export default function GameStage({
  round,
  host,
  pet,
  petName,
  onAnswer,
  onRoundDone,
}: Props) {
  const shared = { host, onAnswer, onRoundDone };

  switch (round.game) {
    case 'match_words':
      return (
        <MatchWords
          words={round.words}
          distractors={round.distractors}
          {...shared}
        />
      );

    case 'match_spoken_word':
      return <MatchSpokenWord questions={round.questions} {...shared} />;

    case 'match_picture':
      return <MatchPicture questions={round.questions} {...shared} />;

    case 'missing_letter':
      return <MissingLetter words={round.words} {...shared} />;

    case 'snail_talk':
      return (
        <SnailTalk
          words={round.words}
          pool={round.pool}
          pet={pet}
          petName={petName}
          {...shared}
        />
      );

    case 'accessory_train':
      return <AccessoryTrain words={round.words} {...shared} />;
  }
}
