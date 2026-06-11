import { createDeck, OPPONENT_STARTING_DECK, STARTING_DECK } from './cards';
import type { Card, GameState, Lane, PlayerId, PlayerState } from './types';

export const HERO_HEALTH = 30;
export const STARTING_MANA = 3;
export const MAX_MANA = 10;
export const STARTING_HAND_SIZE = 4;
export const LANE_COUNT = 5;

export interface InitialStateOptions {
  shuffle?: boolean;
  rng?: () => number;
  playerDeckDefinition?: readonly string[];
  opponentDeckDefinition?: readonly string[];
}

function cloneCard(card: Card): Card {
  return { ...card };
}

export function clonePlayer(player: PlayerState): PlayerState {
  return {
    ...player,
    deck: player.deck.map((card) => ({ ...cloneCard(card), keywords: card.keywords ? { ...card.keywords } : undefined })),
    hand: player.hand.map((card) => ({ ...cloneCard(card), keywords: card.keywords ? { ...card.keywords } : undefined })),
    discard: player.discard.map((card) => ({ ...cloneCard(card), keywords: card.keywords ? { ...card.keywords } : undefined }))
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
      opponentCard: lane.opponentCard ? cloneCard(lane.opponentCard) : null,
      pendingSeed: [...lane.pendingSeed]
    })),
    lastAction: state.lastAction ? { ...state.lastAction } : null,
    lanePlayCount: { ...state.lanePlayCount }
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

function createPlayer(id: PlayerId, deckDefinition?: readonly string[]): PlayerState {
  const fallbackDeck = id === 'player' ? STARTING_DECK : OPPONENT_STARTING_DECK;

  return {
    id,
    name: id === 'player' ? 'You' : 'AI Opponent',
    heroHealth: HERO_HEALTH,
    mana: STARTING_MANA,
    maxMana: STARTING_MANA,
    deck: createDeck(id, deckDefinition ?? fallbackDeck),
    hand: [],
    discard: []
  };
}

function createLanes(): Lane[] {
  return Array.from({ length: LANE_COUNT }, (_, index) => ({
    index,
    terrain: null,
    playerCard: null,
    opponentCard: null,
    pendingSeed: []
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
  const { shuffle = true, rng = Math.random, playerDeckDefinition, opponentDeckDefinition } = options;

  const initialState: GameState = {
    players: {
      player: createPlayer('player', playerDeckDefinition),
      opponent: createPlayer('opponent', opponentDeckDefinition)
    },
    lanes: createLanes(),
    currentTurn: 'player',
    round: 1,
    winner: null,
    lastAction: null,
    lanePlayCount: {
      player: 0,
      opponent: 0
    }
  };

  if (shuffle) {
    initialState.players.player.deck = shuffleDeck(initialState.players.player.deck, rng);
    initialState.players.opponent.deck = shuffleDeck(initialState.players.opponent.deck, rng);
  }

  let stateWithHands = drawCard(initialState, 'player', STARTING_HAND_SIZE);
  stateWithHands = drawCard(stateWithHands, 'opponent', STARTING_HAND_SIZE);

  return stateWithHands;
}
