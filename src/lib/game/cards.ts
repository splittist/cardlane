import type { Card, CardDefinition, PlayerId } from './types';

export const CARD_LIBRARY: CardDefinition[] = [
  {
    id: 'reef-runner',
    name: 'Reef Runner',
    art: '🐟',
    faction: 'sea',
    cost: 1,
    attack: 1,
    health: 2,
    keywords: { school: true, tide: true },
    createsTerrain: 'flooded'
  },
  {
    id: 'wave-lancer',
    name: 'Wave Lancer',
    art: '🪼',
    faction: 'sea',
    cost: 2,
    attack: 2,
    health: 2,
    keywords: { current: 1, surge: 1 },
    createsTerrain: 'flooded'
  },
  {
    id: 'drown-priest',
    name: 'Drown Priest',
    art: '🐙',
    faction: 'sea',
    cost: 3,
    attack: 2,
    health: 3,
    keywords: { drown: true, tide: true },
    createsTerrain: 'flooded'
  },
  {
    id: 'mud-skipper',
    name: 'Mud Skipper',
    art: '🦀',
    faction: 'sea',
    cost: 2,
    attack: 2,
    health: 2,
    keywords: { current: 1 },
    createsTerrain: 'mud'
  },
  {
    id: 'tidal-school',
    name: 'Tidal School',
    art: '🐠',
    faction: 'sea',
    cost: 3,
    attack: 2,
    health: 3,
    keywords: { school: true, surge: 1, tide: true },
    createsTerrain: 'flooded'
  },
  {
    id: 'bark-warden',
    name: 'Bark Warden',
    art: '🪵',
    faction: 'forest',
    cost: 2,
    attack: 1,
    health: 4,
    keywords: { rooted: true, canopy: true },
    createsTerrain: 'overgrown'
  },
  {
    id: 'thorn-stag',
    name: 'Thorn Stag',
    art: '🦌',
    faction: 'forest',
    cost: 3,
    attack: 3,
    health: 3,
    keywords: { thorns: 1, grow: true },
    createsTerrain: 'overgrown'
  },
  {
    id: 'sapling-herder',
    name: 'Sapling Herder',
    art: '🌱',
    faction: 'forest',
    cost: 2,
    attack: 1,
    health: 2,
    keywords: { seed: true, grow: true },
    createsTerrain: 'overgrown'
  },
  {
    id: 'grove-giant',
    name: 'Grove Giant',
    art: '🌳',
    faction: 'forest',
    cost: 4,
    attack: 3,
    health: 5,
    keywords: { rooted: true, thorns: 1 },
    createsTerrain: 'overgrown'
  },
  {
    id: 'bog-mystic',
    name: 'Bog Mystic',
    art: '🍄',
    faction: 'forest',
    cost: 3,
    attack: 2,
    health: 3,
    keywords: { grow: true, canopy: true },
    createsTerrain: 'mud'
  }
];

export const STARTING_DECK = [
  'reef-runner',
  'reef-runner',
  'wave-lancer',
  'wave-lancer',
  'drown-priest',
  'mud-skipper',
  'mud-skipper',
  'tidal-school',
  'tidal-school',
  'bark-warden',
  'bark-warden',
  'thorn-stag',
  'sapling-herder',
  'grove-giant'
] as const;

export const OPPONENT_STARTING_DECK = [
  'bark-warden',
  'bark-warden',
  'thorn-stag',
  'thorn-stag',
  'sapling-herder',
  'sapling-herder',
  'grove-giant',
  'grove-giant',
  'bog-mystic',
  'bog-mystic',
  'reef-runner',
  'wave-lancer',
  'mud-skipper',
  'drown-priest'
] as const;

export const DECK_SIZE = STARTING_DECK.length;
export const MAX_COPIES_PER_CARD = 2;

const cardMap = new Map(CARD_LIBRARY.map((card) => [card.id, card]));

export function getCardDefinition(cardId: string): CardDefinition {
  const card = cardMap.get(cardId);

  if (!card) {
    throw new Error(`Unknown card id: ${cardId}`);
  }

  return card;
}

export function createCardInstance(cardId: string, owner: PlayerId, uid?: string): Card {
  const definition = getCardDefinition(cardId);

  return {
    ...definition,
    owner,
    uid: uid ?? `${owner}-${cardId}-${crypto.randomUUID()}`,
    currentHealth: definition.health,
    enteredThisRound: false
  };
}

export function validateDeckDefinition(deckDefinition: readonly string[]): void {
  if (deckDefinition.length !== DECK_SIZE) {
    throw new Error(`Deck must contain exactly ${DECK_SIZE} cards.`);
  }

  const copiesByCard = new Map<string, number>();

  for (const cardId of deckDefinition) {
    getCardDefinition(cardId);
    copiesByCard.set(cardId, (copiesByCard.get(cardId) ?? 0) + 1);
  }

  for (const [cardId, copies] of copiesByCard.entries()) {
    if (copies > MAX_COPIES_PER_CARD) {
      throw new Error(`Deck cannot include more than ${MAX_COPIES_PER_CARD} copies of ${cardId}.`);
    }
  }
}

export function createDeck(owner: PlayerId, deckDefinition: readonly string[] = STARTING_DECK): Card[] {
  validateDeckDefinition(deckDefinition);

  return deckDefinition.map((cardId, index) => createCardInstance(cardId, owner, `${owner}-${cardId}-${index}`));
}
