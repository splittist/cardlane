import type { Card, CardDefinition, PlayerId } from './types';

export const CARD_LIBRARY: CardDefinition[] = [
  { id: 'footman', name: 'Footman', cost: 1, attack: 1, health: 3 },
  { id: 'archer', name: 'Archer', cost: 2, attack: 2, health: 2 },
  { id: 'squire', name: 'Squire', cost: 1, attack: 2, health: 1 },
  { id: 'shieldbearer', name: 'Shieldbearer', cost: 2, attack: 1, health: 4 },
  { id: 'fire-imp', name: 'Fire Imp', cost: 2, attack: 2, health: 1, effect: { type: 'damage-enemy-hero', amount: 1 } },
  { id: 'mana-sprite', name: 'Mana Sprite', cost: 2, attack: 1, health: 2, effect: { type: 'gain-mana', amount: 1 } },
  { id: 'raider', name: 'Raider', cost: 3, attack: 3, health: 2 },
  { id: 'lane-guard', name: 'Lane Guard', cost: 3, attack: 2, health: 4 },
  { id: 'charger', name: 'Charger', cost: 4, attack: 4, health: 2 },
  { id: 'battle-mage', name: 'Battle Mage', cost: 4, attack: 3, health: 3, effect: { type: 'damage-enemy-hero', amount: 1 } },
  { id: 'knight', name: 'Knight', cost: 5, attack: 4, health: 5 },
  { id: 'colossus', name: 'Colossus', cost: 6, attack: 6, health: 6 }
];

export const STARTING_DECK = [
  'footman',
  'footman',
  'squire',
  'shieldbearer',
  'archer',
  'archer',
  'fire-imp',
  'mana-sprite',
  'raider',
  'lane-guard',
  'charger',
  'battle-mage',
  'knight',
  'colossus'
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
    currentHealth: definition.health
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
