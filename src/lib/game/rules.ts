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

function createSapling(owner: PlayerId, uid: string): Card {
  return {
    id: 'sapling-token',
    name: 'Sapling',
    art: '🌱',
    faction: 'forest',
    cost: 0,
    attack: 1,
    health: 1,
    owner,
    uid,
    currentHealth: 1,
    enteredThisRound: false,
    keywords: {
      grow: true
    }
  };
}

function applyTerrainOnEntry(lane: Lane, card: Card): void {
  if (card.faction === 'sea' && lane.terrain === 'overgrown') {
    lane.terrain = 'flooded';
    return;
  }

  if (card.createsTerrain) {
    lane.terrain = card.createsTerrain;
  }
}

function canCardMove(lane: Lane, card: Card): boolean {
  if (lane.terrain === 'mud') {
    return false;
  }

  return !card.keywords?.rooted;
}

function queueSeedIfNeeded(lane: Lane, card: Card): void {
  if (card.keywords?.seed) {
    lane.pendingSeed = [...lane.pendingSeed, card.owner];
  }
}

function removeCardFromLane(state: GameState, lane: Lane, owner: PlayerId): void {
  const slot = getLaneSlot(owner);
  const card = lane[slot];

  if (!card) {
    return;
  }

  queueSeedIfNeeded(lane, card);
  lane[slot] = null;
  addToDiscard(state, card);
}

function moveCardBetweenLanes(state: GameState, owner: PlayerId, fromLaneIndex: number, toLaneIndex: number): boolean {
  if (fromLaneIndex === toLaneIndex) {
    return false;
  }

  const fromLane = state.lanes[fromLaneIndex];
  const toLane = state.lanes[toLaneIndex];
  const slot = getLaneSlot(owner);
  const card = fromLane?.[slot] ?? null;

  if (!fromLane || !toLane || !card || toLane[slot]) {
    return false;
  }

  if (!canCardMove(fromLane, card)) {
    return false;
  }

  fromLane[slot] = null;
  toLane[slot] = {
    ...card,
    enteredThisRound: true
  };
  applyTerrainOnEntry(toLane, toLane[slot] as Card);

  return true;
}

function getInitiativeOrder(round: number): PlayerId[] {
  return round % 2 === 1 ? ['player', 'opponent'] : ['opponent', 'player'];
}

function chooseDirectionalOrder(owner: PlayerId): number[] {
  return owner === 'player' ? [1, -1] : [-1, 1];
}

function chooseTideDestination(state: GameState, owner: PlayerId, laneIndex: number): number | null {
  const slot = getLaneSlot(owner);
  const enemySlot = getLaneSlot(getOpponentId(owner));
  const directionalOrder = chooseDirectionalOrder(owner);
  const candidates = directionalOrder
    .map((direction) => laneIndex + direction)
    .filter((targetIndex) => targetIndex >= 0 && targetIndex < state.lanes.length)
    .filter((targetIndex) => state.lanes[targetIndex][slot] === null);

  if (candidates.length === 0) {
    return null;
  }

  let bestTarget = candidates[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const targetIndex of candidates) {
    const targetLane = state.lanes[targetIndex];
    let score = 0;

    if (targetLane[enemySlot]) {
      score += 2;
    }

    if (targetLane.terrain === 'flooded' && owner === 'player') {
      score += 1;
    }

    if (targetLane.terrain === 'overgrown' && owner === 'opponent') {
      score += 1;
    }

    score -= Math.abs(2 - targetIndex) * 0.1;

    if (score > bestScore) {
      bestScore = score;
      bestTarget = targetIndex;
    }
  }

  return bestTarget;
}

function resolveTideMoves(state: GameState): void {
  const initiativeOrder = getInitiativeOrder(state.round);

  for (const owner of initiativeOrder) {
    const slot = getLaneSlot(owner);
    const laneOrder = owner === 'player' ? state.lanes.map((lane) => lane.index) : [...state.lanes.map((lane) => lane.index)].reverse();

    for (const laneIndex of laneOrder) {
      const lane = state.lanes[laneIndex];
      const card = lane[slot];

      if (!card?.keywords?.tide) {
        continue;
      }

      const destination = chooseTideDestination(state, owner, laneIndex);

      if (destination === null) {
        continue;
      }

      moveCardBetweenLanes(state, owner, laneIndex, destination);
    }
  }
}

function pushCard(
  state: GameState,
  owner: PlayerId,
  fromLaneIndex: number,
  direction: number,
  distance: number
): boolean {
  const sourceLane = state.lanes[fromLaneIndex];
  const slot = getLaneSlot(owner);
  const card = sourceLane?.[slot];

  if (!sourceLane || !card || !canCardMove(sourceLane, card)) {
    return false;
  }

  const targetIndex = fromLaneIndex + direction * distance;

  if (targetIndex < 0 || targetIndex >= state.lanes.length) {
    return false;
  }

  const targetLane = state.lanes[targetIndex];

  if (targetLane[slot]) {
    return false;
  }

  sourceLane[slot] = null;
  targetLane[slot] = {
    ...card,
    enteredThisRound: true
  };
  applyTerrainOnEntry(targetLane, targetLane[slot] as Card);

  return true;
}

function resolveCurrentPushes(state: GameState): void {
  const initiativeOrder = getInitiativeOrder(state.round);

  for (const owner of initiativeOrder) {
    const slot = getLaneSlot(owner);
    const enemyOwner = getOpponentId(owner);
    const enemySlot = getLaneSlot(enemyOwner);
    const laneOrder = owner === 'player' ? state.lanes.map((lane) => lane.index) : [...state.lanes.map((lane) => lane.index)].reverse();

    for (const laneIndex of laneOrder) {
      const lane = state.lanes[laneIndex];
      const sourceCard = lane[slot];

      if (!sourceCard?.keywords?.current || !sourceCard.enteredThisRound) {
        continue;
      }

      if (!lane[enemySlot]) {
        continue;
      }

      const directionalOrder = chooseDirectionalOrder(owner);
      const distance = sourceCard.keywords.current;

      let pushed = false;
      for (const direction of directionalOrder) {
        if (pushCard(state, enemyOwner, laneIndex, direction, distance)) {
          pushed = true;
          break;
        }
      }

      if (!pushed) {
        continue;
      }
    }
  }
}

function resolveDrown(state: GameState): void {
  const initiativeOrder = getInitiativeOrder(state.round);

  for (const owner of initiativeOrder) {
    const slot = getLaneSlot(owner);
    const enemyOwner = getOpponentId(owner);

    for (const lane of state.lanes) {
      const card = lane[slot];

      if (!card?.keywords?.drown || lane.terrain !== 'flooded') {
        continue;
      }

      removeCardFromLane(state, lane, enemyOwner);
    }
  }
}

function getSchoolBonus(state: GameState, owner: PlayerId, laneIndex: number): number {
  const slot = getLaneSlot(owner);
  const adjacent = [laneIndex - 1, laneIndex + 1].filter((index) => index >= 0 && index < state.lanes.length);
  let bonus = 0;

  for (const index of adjacent) {
    if (state.lanes[index][slot]?.keywords?.school) {
      bonus += 1;
    }
  }

  return bonus;
}

function getCanopyMitigation(state: GameState, owner: PlayerId, laneIndex: number): number {
  const slot = getLaneSlot(owner);
  const adjacent = [laneIndex - 1, laneIndex + 1].filter((index) => index >= 0 && index < state.lanes.length);

  for (const index of adjacent) {
    if (state.lanes[index][slot]?.keywords?.canopy) {
      return 1;
    }
  }

  return 0;
}

function getEffectiveAttack(state: GameState, laneIndex: number, card: Card): number {
  const lane = state.lanes[laneIndex];
  let attack = card.attack;

  if (lane.terrain === 'flooded' && card.faction === 'sea') {
    attack += 1;
  }

  if (lane.terrain === 'mud') {
    attack -= 1;
  }

  if (card.keywords?.school) {
    attack += getSchoolBonus(state, card.owner, laneIndex);
  }

  if (card.keywords?.surge && card.enteredThisRound) {
    attack += card.keywords.surge;
  }

  return Math.max(0, attack);
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

function resolveCombat(state: GameState): void {
  for (const lane of state.lanes) {
    const playerCard = lane.playerCard;
    const opponentCard = lane.opponentCard;

    if (playerCard && opponentCard) {
      const laneIndex = lane.index;
      const playerAttack = getEffectiveAttack(state, laneIndex, playerCard);
      const opponentAttack = getEffectiveAttack(state, laneIndex, opponentCard);

      let playerIncoming = Math.max(0, opponentAttack - getCanopyMitigation(state, 'player', laneIndex));
      let opponentIncoming = Math.max(0, playerAttack - getCanopyMitigation(state, 'opponent', laneIndex));

      if (playerCard.keywords?.thorns) {
        opponentIncoming += playerCard.keywords.thorns;
      }

      if (opponentCard.keywords?.thorns) {
        playerIncoming += opponentCard.keywords.thorns;
      }

      const updatedPlayer = {
        ...playerCard,
        currentHealth: playerCard.currentHealth - playerIncoming
      };
      const updatedOpponent = {
        ...opponentCard,
        currentHealth: opponentCard.currentHealth - opponentIncoming
      };

      if (updatedPlayer.currentHealth <= 0) {
        removeCardFromLane(state, lane, 'player');
      } else {
        lane.playerCard = updatedPlayer;
      }

      if (updatedOpponent.currentHealth <= 0) {
        removeCardFromLane(state, lane, 'opponent');
      } else {
        lane.opponentCard = updatedOpponent;
      }

      continue;
    }

    if (playerCard) {
      state.players.opponent.heroHealth -= getEffectiveAttack(state, lane.index, playerCard);
    }

    if (opponentCard) {
      state.players.player.heroHealth -= getEffectiveAttack(state, lane.index, opponentCard);
    }
  }

  state.winner = checkWinCondition(state);
}

function resolveEndOfTurnEffects(state: GameState): void {
  for (const lane of state.lanes) {
    for (const owner of ['player', 'opponent'] as const) {
      const slot = getLaneSlot(owner);
      const card = lane[slot];

      if (!card) {
        continue;
      }

      if (card.keywords?.grow || lane.terrain === 'overgrown') {
        lane[slot] = {
          ...card,
          attack: card.attack + 1,
          currentHealth: card.currentHealth + 1,
          health: card.health + 1
        };
      }

      if (lane[slot]) {
        lane[slot] = {
          ...(lane[slot] as Card),
          enteredThisRound: false
        };
      }
    }
  }
}

function spawnSeeds(state: GameState): void {
  for (const lane of state.lanes) {
    if (lane.pendingSeed.length === 0) {
      continue;
    }

    lane.pendingSeed.forEach((owner, index) => {
      const slot = getLaneSlot(owner);

      if (lane[slot]) {
        return;
      }

      lane[slot] = createSapling(owner, `seed-${state.round + 1}-${lane.index}-${index}`);
    });

    lane.pendingSeed = [];
  }
}

function startNextRound(state: GameState): GameState {
  const nextState = cloneState(state);

  spawnSeeds(nextState);

  for (const playerId of ['player', 'opponent'] as const) {
    const player = nextState.players[playerId];
    player.maxMana = Math.min(MAX_MANA, player.maxMana + 1);
    player.mana = player.maxMana;
  }

  let withDraw = drawCard(nextState, 'player');
  withDraw = drawCard(withDraw, 'opponent');
  withDraw.round += 1;
  withDraw.currentTurn = 'player';
  withDraw.lastAction = null;
  withDraw.lanePlayCount = {
    player: 0,
    opponent: 0
  };

  return withDraw;
}

function resolveRound(state: GameState): GameState {
  const nextState = cloneState(state);

  resolveTideMoves(nextState);
  resolveCurrentPushes(nextState);
  resolveDrown(nextState);
  resolveCombat(nextState);

  if (nextState.winner) {
    return nextState;
  }

  resolveEndOfTurnEffects(nextState);

  return startNextRound(nextState);
}

export function getLegalActions(state: GameState, playerId: PlayerId = state.currentTurn): Action[] {
  if (state.winner || playerId !== state.currentTurn) {
    return [];
  }

  const player = state.players[playerId];
  const slot = getLaneSlot(playerId);
  const actions: Action[] = [];

  if (state.lanePlayCount[playerId] < 1) {
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
    if (state.lanePlayCount[action.playerId] >= 1) {
      throw new Error('You can only play one unit before reveal.');
    }

    const nextState = cloneState(state);
    const player = nextState.players[action.playerId];
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
    lane[slot] = {
      ...card,
      enteredThisRound: true
    };
    applyTerrainOnEntry(lane, lane[slot] as Card);

    nextState.lanePlayCount[action.playerId] += 1;
    nextState.lastAction = action;

    return nextState;
  }

  if (action.playerId === 'player') {
    return {
      ...cloneState(state),
      currentTurn: 'opponent',
      lastAction: action
    };
  }

  const roundResolvedState = resolveRound({
    ...cloneState(state),
    lastAction: action
  });

  return roundResolvedState;
}
