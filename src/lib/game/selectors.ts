import { getLegalActions } from './rules';
import type { Action, Card, GameState, Lane, PlayerId } from './types';

export function getPlayableCards(state: GameState, playerId: PlayerId): Card[] {
  const playableCardIds = new Set(
    getLegalActions(state, playerId)
      .filter((action): action is Extract<Action, { type: 'play-card' }> => action.type === 'play-card')
      .map((action) => action.cardUid)
  );

  return state.players[playerId].hand.filter((card) => playableCardIds.has(card.uid));
}

export function getOccupiedLanes(state: GameState): Lane[] {
  return state.lanes.filter((lane) => lane.playerCard || lane.opponentCard);
}

export function getLaneWinner(lane: Lane): PlayerId | 'contested' | 'empty' {
  if (lane.playerCard && lane.opponentCard) {
    return 'contested';
  }

  if (lane.playerCard) {
    return 'player';
  }

  if (lane.opponentCard) {
    return 'opponent';
  }

  return 'empty';
}
