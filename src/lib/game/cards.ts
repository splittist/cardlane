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

export function createDeck(owner: PlayerId): Card[] {
  return STARTING_DECK.map((cardId, index) => createCardInstance(cardId, owner, `${owner}-${cardId}-${index}`));
}
