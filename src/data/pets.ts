// src/data/pets.ts
//
// The eight adoptable pets. `key` is what gets stored in the database,
// so these strings shouldn't change once a child has adopted one.
//
// Kind matters for rewards: kittens get yarn and scratching posts,
// puppies get bones and tennis balls.

export type PetKind = 'kitten' | 'puppy';

export type Pet = {
  key: string;
  kind: PetKind;
  /** Only used for screen readers — the carousel shows no names. */
  label: string;
  image: string;
};

export const PETS: Pet[] = [
  {
    key: 'kitten_pink_mainecoon',
    kind: 'kitten',
    label: 'Pink fluffy kitten',
    image: '/images/pets/Kitten_PinkMaineCoon.webp',
  },
  {
    key: 'kitten_scottish_fold',
    kind: 'kitten',
    label: 'Gray folded-ear kitten',
    image: '/images/pets/Kitten_ScottishFold.webp',
  },
  {
    key: 'kitten_blue_mainecoon',
    kind: 'kitten',
    label: 'Blue fluffy kitten',
    image: '/images/pets/Kitten_MaineCoon.webp',
  },
  {
    key: 'kitten_orange_tabby',
    kind: 'kitten',
    label: 'Orange tabby kitten',
    image: '/images/pets/Kitten_OrangeTabby.webp',
  },
  {
    key: 'puppy_golden_retriever',
    kind: 'puppy',
    label: 'Golden retriever puppy',
    image: '/images/pets/Puppy_GoldenRetriever.webp',
  },
  {
    key: 'puppy_pomeranian',
    kind: 'puppy',
    label: 'Purple pomeranian puppy',
    image: '/images/pets/Puppy_Pomeranian.webp',
  },
  {
    key: 'puppy_german_shepherd',
    kind: 'puppy',
    label: 'German shepherd puppy',
    image: '/images/pets/Puppy_GermanShepard.webp',
  },
  {
    key: 'puppy_boston_terrier',
    kind: 'puppy',
    label: 'Boston terrier puppy',
    image: '/images/pets/Puppy_BostonTerrier.webp',
  },
];

export function petByKey(key: string | null): Pet | null {
  if (!key) return null;
  return PETS.find((p) => p.key === key) ?? null;
}
