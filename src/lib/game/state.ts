import { createDeck } from './cards';
import type { Card, GameState, Lane, PlayerId, PlayerState } from './types';

export const HERO_HEALTH = 30;
export const STARTING_MANA = 3;
export const MAX_MANA = 10;
export const STARTING_HAND_SIZE = 4;
export const LANE_COUNT = 3;

export interface InitialStateOptions {
  shuffle?: boolean;
  rng?: () => number;
}

function cloneCard(card: Card): Card {
  return { ...card };
}

export function clonePlayer(player: PlayerState): PlayerState {
  return {
    ...player,
    deck: player.deck.map(cloneCard),
    hand: player.hand.map(cloneCard),
    discard: player.discard.map(cloneCard)
  };
}

export function cloneState(state: GameState): GameState {
  return {
    ...state,
    players: {
      player: clonePlayer(state.players.player),
      opponent: clonePlayer(state.players.opponent)
    },
    lanes: state.lanes.map((lane) => ({
      ...lane,
      playerCard: lane.playerCard ? cloneCard(lane.playerCard) : null,
      opponentCard: lane.opponentCard ? cloneCard(lane.opponentCard) : null
    })),
    lastAction: state.lastAction ? { ...state.lastAction } : null
  };
}

export function shuffleDeck<T>(cards: T[], rng: () => number = Math.random): T[] {
  const shuffled = [...cards];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function createPlayer(id: PlayerId): PlayerState {
  return {
    id,
    name: id === 'player' ? 'You' : 'AI Opponent',
    heroHealth: HERO_HEALTH,
    mana: STARTING_MANA,
    maxMana: STARTING_MANA,
    deck: createDeck(id),
    hand: [],
    discard: []
  };
}

function createLanes(): Lane[] {
  return Array.from({ length: LANE_COUNT }, (_, index) => ({
    index,
    playerCard: null,
    opponentCard: null
  }));
}

export function drawCard(state: GameState, playerId: PlayerId, count = 1): GameState {
  const nextState = cloneState(state);
  const player = nextState.players[playerId];

  for (let drawIndex = 0; drawIndex < count; drawIndex += 1) {
    const [nextCard, ...remainingDeck] = player.deck;

    if (!nextCard) {
      break;
    }

    player.deck = remainingDeck;
    player.hand = [...player.hand, nextCard];
  }

  return nextState;
}

export function createInitialState(options: InitialStateOptions = {}): GameState {
  const { shuffle = true, rng = Math.random } = options;

  const initialState: GameState = {
    players: {
      player: createPlayer('player'),
      opponent: createPlayer('opponent')
    },
    lanes: createLanes(),
    currentTurn: 'player',
    round: 1,
    winner: null,
    lastAction: null
  };

  if (shuffle) {
    initialState.players.player.deck = shuffleDeck(initialState.players.player.deck, rng);
    initialState.players.opponent.deck = shuffleDeck(initialState.players.opponent.deck, rng);
  }

  let stateWithHands = drawCard(initialState, 'player', STARTING_HAND_SIZE);
  stateWithHands = drawCard(stateWithHands, 'opponent', STARTING_HAND_SIZE);

  return stateWithHands;
}
