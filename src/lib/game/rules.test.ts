import { describe, expect, it } from 'vitest';

import { OPPONENT_STARTING_DECK, STARTING_DECK } from './cards';
import { applyAction, getLegalActions } from './rules';
import { createInitialState } from './state';

function reorderDeck(baseDeck: readonly string[], front: string[]): string[] {
  const remaining = [...baseDeck];
  const ordered: string[] = [];

  for (const cardId of front) {
    const index = remaining.findIndex((entry) => entry === cardId);

    if (index === -1) {
      throw new Error(`Cannot reorder deck with missing card: ${cardId}`);
    }

    ordered.push(cardId);
    remaining.splice(index, 1);
  }

  return [...ordered, ...remaining];
}

describe('sea vs forest rules', () => {
  it('creates five lanes in the initial state', () => {
    const state = createInitialState({ shuffle: false });

    expect(state.lanes).toHaveLength(5);
  });

  it('allows only one play before reveal', () => {
    const state = createInitialState({ shuffle: false });
    const playerPlay = getLegalActions(state, 'player').find((action) => action.type === 'play-card');

    if (!playerPlay || playerPlay.type !== 'play-card') {
      throw new Error('Expected a legal play-card action.');
    }

    const afterPlay = applyAction(state, playerPlay);
    const followup = getLegalActions(afterPlay, 'player');

    expect(followup.filter((action) => action.type === 'play-card')).toHaveLength(0);
    expect(followup.some((action) => action.type === 'end-turn')).toBe(true);
  });

  it('resolves Current pushes using initiative order', () => {
    const playerDeck = reorderDeck(STARTING_DECK, ['wave-lancer', 'reef-runner', 'tidal-school', 'mud-skipper']);
    const opponentDeck = reorderDeck(OPPONENT_STARTING_DECK, ['thorn-stag', 'bark-warden', 'sapling-herder', 'bog-mystic']);
    let state = createInitialState({
      shuffle: false,
      playerDeckDefinition: playerDeck,
      opponentDeckDefinition: opponentDeck
    });

    const lancer = state.players.player.hand.find((card) => card.id === 'wave-lancer');
    const stag = state.players.opponent.hand.find((card) => card.id === 'thorn-stag');

    if (!lancer || !stag) {
      throw new Error('Expected wave-lancer and thorn-stag in opening hands.');
    }

    state = applyAction(state, {
      type: 'play-card',
      playerId: 'player',
      cardUid: lancer.uid,
      laneIndex: 2
    });
    state = applyAction(state, { type: 'end-turn', playerId: 'player' });
    state = applyAction(state, {
      type: 'play-card',
      playerId: 'opponent',
      cardUid: stag.uid,
      laneIndex: 2
    });
    state = applyAction(state, { type: 'end-turn', playerId: 'opponent' });

    expect(state.round).toBe(2);
    expect(state.lanes[2].playerCard?.id).toBe('wave-lancer');
    expect(state.lanes[3].opponentCard?.id).toBe('thorn-stag');
  });

  it('applies Drown on flooded terrain before combat', () => {
    const playerDeck = reorderDeck(STARTING_DECK, ['drown-priest', 'wave-lancer', 'reef-runner', 'tidal-school']);
    const opponentDeck = reorderDeck(OPPONENT_STARTING_DECK, ['thorn-stag', 'bark-warden', 'sapling-herder', 'bog-mystic']);
    let state = createInitialState({
      shuffle: false,
      playerDeckDefinition: playerDeck,
      opponentDeckDefinition: opponentDeck
    });

    const drownPriest = state.players.player.hand.find((card) => card.id === 'drown-priest');
    const stag = state.players.opponent.hand.find((card) => card.id === 'thorn-stag');

    if (!drownPriest || !stag) {
      throw new Error('Expected drown-priest and thorn-stag in opening hands.');
    }

    state = applyAction(state, {
      type: 'play-card',
      playerId: 'player',
      cardUid: drownPriest.uid,
      laneIndex: 1
    });
    state = applyAction(state, { type: 'end-turn', playerId: 'player' });
    state = applyAction(state, {
      type: 'play-card',
      playerId: 'opponent',
      cardUid: stag.uid,
      laneIndex: 1
    });
    state = applyAction(state, { type: 'end-turn', playerId: 'opponent' });

    expect(state.lanes[1].terrain).toBe('flooded');
    expect(state.lanes[1].opponentCard).toBeNull();
    expect(state.players.opponent.discard.some((card) => card.id === 'thorn-stag')).toBe(true);
  });

  it('grows units on overgrown terrain at end of turn', () => {
    const playerDeck = reorderDeck(STARTING_DECK, ['thorn-stag', 'bark-warden', 'sapling-herder', 'grove-giant']);
    const opponentDeck = reorderDeck(OPPONENT_STARTING_DECK, ['reef-runner', 'wave-lancer', 'mud-skipper', 'drown-priest']);
    let state = createInitialState({
      shuffle: false,
      playerDeckDefinition: playerDeck,
      opponentDeckDefinition: opponentDeck
    });

    const stag = state.players.player.hand.find((card) => card.id === 'thorn-stag');

    if (!stag) {
      throw new Error('Expected thorn-stag in opening hand.');
    }

    state = applyAction(state, {
      type: 'play-card',
      playerId: 'player',
      cardUid: stag.uid,
      laneIndex: 0
    });
    state = applyAction(state, { type: 'end-turn', playerId: 'player' });
    state = applyAction(state, { type: 'end-turn', playerId: 'opponent' });

    expect(state.lanes[0].terrain).toBe('overgrown');
    expect(state.lanes[0].playerCard?.attack).toBe(4);
    expect(state.lanes[0].playerCard?.currentHealth).toBe(4);
  });
});
