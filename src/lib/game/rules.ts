import { drawCard, MAX_MANA, cloneState } from './state';
import type { Action, Card, GameState, Lane, PlayerId, Winner } from './types';

function getLaneSlot(playerId: PlayerId): 'playerCard' | 'opponentCard' {
  return playerId === 'player' ? 'playerCard' : 'opponentCard';
}

function getOpponentId(playerId: PlayerId): PlayerId {
  return playerId === 'player' ? 'opponent' : 'player';
}

function findLane(state: GameState, laneIndex: number): Lane {
  const lane = state.lanes.find((entry) => entry.index === laneIndex);

  if (!lane) {
    throw new Error(`Unknown lane index: ${laneIndex}`);
  }

  return lane;
}

function findCardIndex(state: GameState, playerId: PlayerId, cardUid: string): number {
  return state.players[playerId].hand.findIndex((card) => card.uid === cardUid);
}

function addToDiscard(state: GameState, card: Card): void {
  state.players[card.owner].discard = [...state.players[card.owner].discard, { ...card }];
}

function startNextRound(state: GameState): GameState {
  let nextState = cloneState(state);

  for (const playerId of ['player', 'opponent'] as const) {
    const player = nextState.players[playerId];
    player.maxMana = Math.min(MAX_MANA, player.maxMana + 1);
    player.mana = player.maxMana;
    nextState = drawCard(nextState, playerId);
  }

  nextState.round += 1;
  nextState.currentTurn = 'player';
  nextState.lastAction = null;

  return nextState;
}

export function checkWinCondition(state: GameState): Winner {
  const playerHealth = state.players.player.heroHealth;
  const opponentHealth = state.players.opponent.heroHealth;

  if (playerHealth <= 0 && opponentHealth <= 0) {
    return 'draw';
  }

  if (opponentHealth <= 0) {
    return 'player';
  }

  if (playerHealth <= 0) {
    return 'opponent';
  }

  return null;
}

export function getLegalActions(state: GameState, playerId: PlayerId = state.currentTurn): Action[] {
  if (state.winner || playerId !== state.currentTurn) {
    return [];
  }

  const player = state.players[playerId];
  const slot = getLaneSlot(playerId);
  const actions: Action[] = [];

  for (const card of player.hand) {
    if (card.cost > player.mana) {
      continue;
    }

    for (const lane of state.lanes) {
      if (!lane[slot]) {
        actions.push({
          type: 'play-card',
          playerId,
          cardUid: card.uid,
          laneIndex: lane.index
        });
      }
    }
  }

  actions.push({ type: 'end-turn', playerId });

  return actions;
}

export function applyAction(state: GameState, action: Action): GameState {
  if (state.winner) {
    throw new Error('The game is already over.');
  }

  if (action.playerId !== state.currentTurn) {
    throw new Error('It is not this player\'s turn.');
  }

  if (action.type === 'play-card') {
    const nextState = cloneState(state);
    const player = nextState.players[action.playerId];
    const opponent = nextState.players[getOpponentId(action.playerId)];
    const cardIndex = findCardIndex(nextState, action.playerId, action.cardUid);

    if (cardIndex === -1) {
      throw new Error('Card is not in hand.');
    }

    const card = player.hand[cardIndex];

    if (card.cost > player.mana) {
      throw new Error('Not enough mana.');
    }

    const lane = findLane(nextState, action.laneIndex);
    const slot = getLaneSlot(action.playerId);

    if (lane[slot]) {
      throw new Error('Lane is already occupied.');
    }

    player.hand = player.hand.filter((handCard) => handCard.uid !== action.cardUid);
    player.mana -= card.cost;
    lane[slot] = { ...card };

    if (card.effect?.type === 'damage-enemy-hero') {
      opponent.heroHealth -= card.effect.amount;
    }

    if (card.effect?.type === 'gain-mana') {
      player.mana = Math.min(MAX_MANA, player.mana + card.effect.amount);
    }

    nextState.lastAction = action;
    nextState.winner = checkWinCondition(nextState);

    return nextState;
  }

  if (action.playerId === 'player') {
    return {
      ...cloneState(state),
      currentTurn: 'opponent',
      lastAction: action
    };
  }

  const combatState = resolveCombat({
    ...cloneState(state),
    lastAction: action
  });

  if (combatState.winner) {
    return combatState;
  }

  return startNextRound(combatState);
}

export function resolveCombat(state: GameState): GameState {
  const nextState = cloneState(state);

  for (const lane of nextState.lanes) {
    const playerCard = lane.playerCard;
    const opponentCard = lane.opponentCard;

    if (playerCard && opponentCard) {
      const updatedPlayerCard = {
        ...playerCard,
        currentHealth: playerCard.currentHealth - opponentCard.attack
      };
      const updatedOpponentCard = {
        ...opponentCard,
        currentHealth: opponentCard.currentHealth - playerCard.attack
      };

      if (updatedPlayerCard.currentHealth > 0) {
        lane.playerCard = updatedPlayerCard;
      } else {
        lane.playerCard = null;
        addToDiscard(nextState, updatedPlayerCard);
      }

      if (updatedOpponentCard.currentHealth > 0) {
        lane.opponentCard = updatedOpponentCard;
      } else {
        lane.opponentCard = null;
        addToDiscard(nextState, updatedOpponentCard);
      }

      continue;
    }

    if (playerCard) {
      nextState.players.opponent.heroHealth -= playerCard.attack;
    }

    if (opponentCard) {
      nextState.players.player.heroHealth -= opponentCard.attack;
    }
  }

  nextState.winner = checkWinCondition(nextState);

  return nextState;
}
