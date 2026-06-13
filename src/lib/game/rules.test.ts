import { describe, expect, it } from 'vitest';

import { OPPONENT_STARTING_DECK, STARTING_DECK } from './cards';
import {
	applyAction,
	getLegalActions,
	getRoundResolutionSteps,
	revealRound
} from './rules';
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

function revealAfterBothPlayersLock(
	state: ReturnType<typeof createInitialState>
) {
	const lockedState = applyAction(state, {
		type: 'end-turn',
		playerId: 'opponent'
	});
	return revealRound(lockedState);
}

describe('sea vs forest rules', () => {
	it('creates five lanes in the initial state', () => {
		const state = createInitialState({ shuffle: false });

		expect(state.lanes).toHaveLength(5);
	});

	it('allows multiple plays before reveal while mana and lanes remain', () => {
		const state = createInitialState({ shuffle: false });
		const playerPlay = getLegalActions(state, 'player').find(
			(action) => action.type === 'play-card'
		);

		if (!playerPlay || playerPlay.type !== 'play-card') {
			throw new Error('Expected a legal play-card action.');
		}

		const afterPlay = applyAction(state, playerPlay);
		const followup = getLegalActions(afterPlay, 'player');

		expect(afterPlay.pendingReveal.player).toHaveLength(1);
		expect(
			followup.filter((action) => action.type === 'play-card').length
		).toBeGreaterThan(0);
		expect(followup.some((action) => action.type === 'end-turn')).toBe(true);
	});

	it('blocks queuing two cards into the same lane in one planning phase', () => {
		let state = createInitialState({ shuffle: false });
		const firstPlay = getLegalActions(state, 'player').find(
			(action) => action.type === 'play-card' && action.laneIndex === 0
		);

		if (!firstPlay || firstPlay.type !== 'play-card') {
			throw new Error('Expected a legal play-card action for lane 1.');
		}

		state = applyAction(state, firstPlay);

		const secondIntoSameLane = getLegalActions(state, 'player').filter(
			(action) => action.type === 'play-card' && action.laneIndex === 0
		);

		expect(secondIntoSameLane).toHaveLength(0);
	});

	it('pauses after both turns until reveal is triggered', () => {
		let state = createInitialState({ shuffle: false });

		state = applyAction(state, { type: 'end-turn', playerId: 'player' });
		state = applyAction(state, { type: 'end-turn', playerId: 'opponent' });

		expect(state.phase).toBe('reveal-ready');
		expect(state.round).toBe(1);
	});

	it('resolves Current pushes using initiative order', () => {
		const playerDeck = reorderDeck(STARTING_DECK, [
			'wave-lancer',
			'reef-runner',
			'tidal-school',
			'mud-skipper'
		]);
		const opponentDeck = reorderDeck(OPPONENT_STARTING_DECK, [
			'thorn-stag',
			'bark-warden',
			'sapling-herder',
			'bog-mystic'
		]);
		let state = createInitialState({
			shuffle: false,
			playerDeckDefinition: playerDeck,
			opponentDeckDefinition: opponentDeck
		});

		const lancer = state.players.player.hand.find(
			(card) => card.id === 'wave-lancer'
		);
		const stag = state.players.opponent.hand.find(
			(card) => card.id === 'thorn-stag'
		);

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
		state = revealAfterBothPlayersLock(state);

		expect(state.round).toBe(2);
		expect(state.lanes[2].playerCard?.id).toBe('wave-lancer');
		expect(state.lanes[3].opponentCard?.id).toBe('thorn-stag');
	});

	it('applies Drown on flooded terrain before combat', () => {
		const playerDeck = reorderDeck(STARTING_DECK, [
			'drown-priest',
			'wave-lancer',
			'reef-runner',
			'tidal-school'
		]);
		const opponentDeck = reorderDeck(OPPONENT_STARTING_DECK, [
			'thorn-stag',
			'bark-warden',
			'sapling-herder',
			'bog-mystic'
		]);
		let state = createInitialState({
			shuffle: false,
			playerDeckDefinition: playerDeck,
			opponentDeckDefinition: opponentDeck
		});

		const drownPriest = state.players.player.hand.find(
			(card) => card.id === 'drown-priest'
		);
		const stag = state.players.opponent.hand.find(
			(card) => card.id === 'thorn-stag'
		);

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
		state = revealAfterBothPlayersLock(state);

		expect(state.lanes[1].terrain).toBe('flooded');
		expect(state.lanes[1].opponentCard).toBeNull();
		expect(
			state.players.opponent.discard.some((card) => card.id === 'thorn-stag')
		).toBe(true);
	});

	it('grows units on overgrown terrain at end of turn', () => {
		const playerDeck = reorderDeck(STARTING_DECK, [
			'thorn-stag',
			'bark-warden',
			'sapling-herder',
			'grove-giant'
		]);
		const opponentDeck = reorderDeck(OPPONENT_STARTING_DECK, [
			'reef-runner',
			'wave-lancer',
			'mud-skipper',
			'drown-priest'
		]);
		let state = createInitialState({
			shuffle: false,
			playerDeckDefinition: playerDeck,
			opponentDeckDefinition: opponentDeck
		});

		const stag = state.players.player.hand.find(
			(card) => card.id === 'thorn-stag'
		);

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
		state = revealAfterBothPlayersLock(state);

		expect(state.lanes[0].terrain).toBe('overgrown');
		expect(state.lanes[0].playerCard?.attack).toBe(4);
		expect(state.lanes[0].playerCard?.currentHealth).toBe(4);
	});

	it('exposes staged round snapshots without changing the final reveal result', () => {
		const playerDeck = reorderDeck(STARTING_DECK, [
			'drown-priest',
			'wave-lancer',
			'reef-runner',
			'tidal-school'
		]);
		const opponentDeck = reorderDeck(OPPONENT_STARTING_DECK, [
			'thorn-stag',
			'bark-warden',
			'sapling-herder',
			'bog-mystic'
		]);
		let state = createInitialState({
			shuffle: false,
			playerDeckDefinition: playerDeck,
			opponentDeckDefinition: opponentDeck
		});

		const drownPriest = state.players.player.hand.find(
			(card) => card.id === 'drown-priest'
		);
		const stag = state.players.opponent.hand.find(
			(card) => card.id === 'thorn-stag'
		);

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

		const steps = getRoundResolutionSteps(state);
		const finalState = revealRound(state);

		expect(steps.map((step) => step.label)).toEqual([
			'Reveal',
			'Tide moves',
			'Current pushes',
			'Drown',
			'Combat',
			'Growth',
			'Round 2'
		]);
		expect(steps[0].state.lanes[1].playerCard?.id).toBe('drown-priest');
		expect(steps[3].state.lanes[1].opponentCard).toBeNull();
		expect(steps[steps.length - 1].state).toEqual(finalState);
	});

	it('damages a hero that cannot draw for the next round', () => {
		let state = createInitialState({ shuffle: false });
		const runner = state.players.player.hand.find(
			(card) => card.id === 'reef-runner'
		);

		if (!runner) {
			throw new Error('Expected reef-runner in opening hand.');
		}

		state = applyAction(state, {
			type: 'play-card',
			playerId: 'player',
			cardUid: runner.uid,
			laneIndex: 0
		});
		state.players.player.deck = [];
		state.players.player.heroHealth = 10;
		state = applyAction(state, { type: 'end-turn', playerId: 'player' });
		state = revealAfterBothPlayersLock(state);

		expect(state.round).toBe(2);
		expect(state.players.player.heroHealth).toBe(9);
		expect(state.winner).toBeNull();
	});

	it('allows simultaneous deck exhaustion to end in a draw', () => {
		const playerDeck = reorderDeck(STARTING_DECK, [
			'reef-runner',
			'wave-lancer',
			'drown-priest',
			'mud-skipper'
		]);
		const opponentDeck = reorderDeck(OPPONENT_STARTING_DECK, [
			'bark-warden',
			'thorn-stag',
			'sapling-herder',
			'bog-mystic'
		]);
		let state = createInitialState({
			shuffle: false,
			playerDeckDefinition: playerDeck,
			opponentDeckDefinition: opponentDeck
		});
		const runner = state.players.player.hand.find(
			(card) => card.id === 'reef-runner'
		);
		const warden = state.players.opponent.hand.find(
			(card) => card.id === 'bark-warden'
		);

		if (!runner || !warden) {
			throw new Error('Expected reef-runner and bark-warden in opening hands.');
		}

		state = applyAction(state, {
			type: 'play-card',
			playerId: 'player',
			cardUid: runner.uid,
			laneIndex: 2
		});
		state = applyAction(state, { type: 'end-turn', playerId: 'player' });
		state = applyAction(state, {
			type: 'play-card',
			playerId: 'opponent',
			cardUid: warden.uid,
			laneIndex: 2
		});
		state.players.player.deck = [];
		state.players.opponent.deck = [];
		state.players.player.heroHealth = 1;
		state.players.opponent.heroHealth = 1;
		state = revealAfterBothPlayersLock(state);

		expect(state.players.player.heroHealth).toBe(0);
		expect(state.players.opponent.heroHealth).toBe(0);
		expect(state.winner).toBe('draw');
	});
});
