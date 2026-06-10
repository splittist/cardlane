import { describe, expect, it } from 'vitest';

import { createCardInstance } from './cards';
import { applyAction, checkWinCondition, getLegalActions, resolveCombat } from './rules';
import { createInitialState, drawCard } from './state';
import type { GameState } from './types';

function createCombatState(): GameState {
  return {
    players: {
      player: {
        id: 'player',
        name: 'You',
        heroHealth: 30,
        mana: 3,
        maxMana: 3,
        deck: [],
        hand: [],
        discard: []
      },
      opponent: {
        id: 'opponent',
        name: 'AI Opponent',
        heroHealth: 30,
        mana: 3,
        maxMana: 3,
        deck: [],
        hand: [],
        discard: []
      }
    },
    lanes: [
      {
        index: 0,
        playerCard: createCardInstance('lane-guard', 'player', 'player-guard'),
        opponentCard: createCardInstance('raider', 'opponent', 'opponent-raider')
      },
      {
        index: 1,
        playerCard: createCardInstance('archer', 'player', 'player-archer'),
        opponentCard: null
      },
      {
        index: 2,
        playerCard: null,
        opponentCard: null
      }
    ],
    currentTurn: 'opponent',
    round: 1,
    winner: null,
    lastAction: null
  };
}

describe('game rules', () => {
  it('resolves combat and hero damage across lanes', () => {
    const resolved = resolveCombat(createCombatState());

    expect(resolved.lanes[0].playerCard?.currentHealth).toBe(1);
    expect(resolved.lanes[0].opponentCard).toBeNull();
    expect(resolved.players.opponent.heroHealth).toBe(28);
    expect(resolved.players.opponent.discard).toHaveLength(1);
  });

  it('prevents placing a card into an occupied lane', () => {
    const initial = createInitialState({ shuffle: false });
    const firstCard = initial.players.player.hand[0];
    const afterPlay = applyAction(initial, {
      type: 'play-card',
      playerId: 'player',
      cardUid: firstCard.uid,
      laneIndex: 0
    });

    const illegalAction = {
      type: 'play-card' as const,
      playerId: 'player' as const,
      cardUid: afterPlay.players.player.hand[0].uid,
      laneIndex: 0
    };

    expect(getLegalActions(afterPlay)).not.toContainEqual(illegalAction);
    expect(() => applyAction(afterPlay, illegalAction)).toThrow('Lane is already occupied.');
  });

  it('draws cards without mutating the original state', () => {
    const initial = createInitialState({ shuffle: false });
    const drawn = drawCard(initial, 'player');

    expect(initial.players.player.hand).toHaveLength(4);
    expect(drawn.players.player.hand).toHaveLength(5);
    expect(drawn.players.player.deck).toHaveLength(initial.players.player.deck.length - 1);
  });

  it('spends mana when playing a card and keeps the card on the board', () => {
    const initial = createInitialState({ shuffle: false });
    const manaSprite = initial.players.player.hand.find((card) => card.id === 'mana-sprite') ?? initial.players.player.hand[0];
    const updated = applyAction(initial, {
      type: 'play-card',
      playerId: 'player',
      cardUid: manaSprite.uid,
      laneIndex: 1
    });

    const expectedMana = initial.players.player.mana - manaSprite.cost + (manaSprite.effect?.type === 'gain-mana' ? manaSprite.effect.amount : 0);

    expect(updated.players.player.mana).toBe(expectedMana);
    expect(updated.lanes[1].playerCard?.uid).toBe(manaSprite.uid);
    expect(updated.players.player.hand.some((card) => card.uid === manaSprite.uid)).toBe(false);
  });

  it('detects when a hero has been defeated', () => {
    const state = createCombatState();
    state.players.opponent.heroHealth = 2;

    const resolved = resolveCombat(state);

    expect(checkWinCondition(resolved)).toBe('player');
    expect(resolved.winner).toBe('player');
  });
});
