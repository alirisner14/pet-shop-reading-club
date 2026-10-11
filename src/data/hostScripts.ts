// src/data/hostScripts.ts
//
// The text of every host line. Two jobs:
//   1. on-screen captions
//   2. what text-to-speech reads when the recorded MP3 isn't there yet
//
// Keys match the filenames in public/audio/host/<host>/, so once a
// recording is added it takes over automatically.

export const HOST_LINES: Record<string, string> = {
  // First-time welcome
  'intro-1': "Hi! Welcome to the Pet Shop Reading Club. I'm your reading buddy!",
  'intro-2':
    "We have so many pets here, and they're all waiting for someone to take them home.",
  'intro-3': 'See this over here? That is the pet food meter.',
  'intro-4': 'Every time you get a word right, it fills up a little bit more.',
  'intro-5': 'When it is all the way full, you get to choose your very own pet!',
  'intro-6':
    'Then you can take your pet home, and keep playing to earn toys and collars for your pet, and decorations for their room.',
  'intro-7': "Are you ready? Let's read!",

  // Returning welcome
  'welcome-back-1': "Hi again! I'm so glad you came back.",
  'welcome-back-2': 'There you are! Ready to play?',
  'welcome-back-3': "Welcome back! Let's fill up that meter.",

  // Mini game instructions
  'game-match-words':
    "Let's play Match the Words! Find the two words that look exactly the same.",
  'game-match-spoken':
    "I'm going to say a word. Listen carefully, then tap the word you hear.",
  'game-match-picture':
    'Look at the picture. Which word goes with it? Tap the right one.',
  'game-missing-letter':
    'Uh oh! This word is missing a letter. Tap the letter that finishes it.',
  'game-snail-talk':
    "Listen! I'll say a word very, very slowly, one sound at a time. Put the sounds together, then tap the word you hear.",
  'game-accessory-train':
    "Let's break this word into its sounds. Drag each sound into its very own bed, in order.",

  // Correct
  'correct-1': 'Yes!',
  'correct-2': "That's it!",
  'correct-3': 'Great job!',
  'correct-4': 'You did it!',
  'correct-5': 'Perfect!',
  'correct-6': "Wow, you're really good at this.",
  'correct-7': 'Nice work!',
  'correct-8': 'You got it!',

  // Wrong
  'wrong-1': 'Not quite. Try again!',
  'wrong-2': 'Almost! Give it one more try.',
  'wrong-3': "Hmm, let's look again.",
  'wrong-4': "That's a tricky one. Try another.",
  'wrong-5': 'Close! Try a different one.',

  // Encouragement
  'encourage-1': "You're doing great. Keep going!",
  'encourage-2': 'This one is tricky. Take your time.',
  'encourage-3': 'I know you can do it.',
  'encourage-4': "Let's listen one more time.",

  // Meter and rewards
  'meter-quarter': 'Look, the meter is filling up!',
  'meter-half': "You're halfway there!",
  'meter-almost': 'Almost full! Just a little more.',
  'meter-full': 'The meter is full! You did it!',
  'choose-pet':
    "It's time to choose your pet! Look at all of them. Tap the arrows to see more.",
  'pet-chosen': 'Oh, what a good choice! Your new friend is so happy.',
  'take-home': "Now let's take your new friend home!",
  'choose-reward': 'You earned a present! Pick one for your pet.',
  'drag-reward':
    'Press and hold your present, then drag it up into the room!',
  'reward-placed': 'That looks perfect right there.',
  'level-complete': "You finished a whole level! You're such a good reader.",
  'new-words': 'I have some new words for you. Are you ready?',

  // Navigation
  'practice-start': "Let's practice! No pressure. Just have fun.",
  goodbye: 'Bye for now! Come back soon.',
};

/** Text for a clip key, or empty string if unknown. */
export function hostLine(clip: string): string {
  return HOST_LINES[clip] ?? '';
}
