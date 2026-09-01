// src/data/pets.ts
//
// The eight adoptable pets.
//
// `key` is stored in the database, so once a child has adopted a pet
// these strings must not change — renaming one would orphan her pet.
//
// Every pet has an eyes-open and an eyes-closed image. That pair alone
// is enough for a blink, which is most of what makes a static character
// feel alive. Longer sequences (_Lay, _Spin, _Wag, _Swish) follow the
// same base name plus a frame number.

export type PetKind = 'kitten' | 'puppy';

export type Pet = {
  key: string;
  kind: PetKind;
  /** Filename stem, e.g. 'Kitten_LongHair'. Frames build from this. */
  base: string;
  /** Screen-reader label. The carousel shows no names. */
  label: string;
};

export const PETS: Pet[] = [
  { key: 'kitten_longhair', kind: 'kitten', base: 'Kitten_LongHair', label: 'Pink fluffy kitten' },
  { key: 'kitten_scottish_fold', kind: 'kitten', base: 'Kitten_ScottishFold', label: 'Gray folded-ear kitten' },
  { key: 'kitten_blue_mainecoon', kind: 'kitten', base: 'Kitten_MaineCoon', label: 'Blue fluffy kitten' },
  { key: 'kitten_orange_tabby', kind: 'kitten', base: 'Kitten_OrangeTabby', label: 'Orange tabby kitten' },
  { key: 'puppy_golden_retriever', kind: 'puppy', base: 'Puppy_GoldenRetriever', label: 'Golden retriever puppy' },
  { key: 'puppy_pomeranian', kind: 'puppy', base: 'Puppy_Pomeranian', label: 'Purple pomeranian puppy' },
  { key: 'puppy_german_shepherd', kind: 'puppy', base: 'Puppy_GermanShepard', label: 'German shepherd puppy' },
  { key: 'puppy_boston_terrier', kind: 'puppy', base: 'Puppy_BostonTerrier', label: 'Boston terrier puppy' },
];

export function petByKey(key: string | null): Pet | null {
  if (!key) return null;
  return PETS.find((p) => p.key === key) ?? null;
}

// ------------------------------------------------------------
// Image paths
// ------------------------------------------------------------

const DIR = '/images/pets';

/** Eyes open — the default. */
export function petOpen(pet: Pet): string {
  return `${DIR}/${pet.base}_Open.webp`;
}

/** Eyes closed — the other half of a blink. */
export function petClosed(pet: Pet): string {
  return `${DIR}/${pet.base}_Closed.webp`;
}

/**
 * Which tail animation a pet uses. Puppies wag, kittens swish — the
 * files are named differently, so this keeps that detail in one place.
 */
export function tailAnimation(pet: Pet): string {
  return pet.kind === 'puppy' ? 'Wag' : 'Swish';
}

/** One frame of a named sequence, e.g. petFrame(pet, 'Lay', 3). */
export function petFrame(pet: Pet, animation: string, frame: number): string {
  return `${DIR}/${pet.base}_${animation}_Frame${frame}.webp`;
}
