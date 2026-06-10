export type PlayerId = 'player' | 'opponent';
export type Winner = PlayerId | 'draw' | null;

export type CardEffect =
  | {
      type: 'damage-enemy-hero';
      amount: number;
    }
  | {
      type: 'gain-mana';
      amount: number;
    };

export interface CardDefinition {
  id: string;
  name: string;
  cost: number;
  attack: number;
  health: number;
  effect?: CardEffect;
}

export interface Card extends CardDefinition {
  uid: string;
  owner: PlayerId;
  currentHealth: number;
}

export interface PlayerState {
  id: PlayerId;
  name: string;
  heroHealth: number;
  mana: number;
  maxMana: number;
  deck: Card[];
  hand: Card[];
  discard: Card[];
}

export interface Lane {
  index: number;
  playerCard: Card | null;
  opponentCard: Card | null;
}

export interface GameState {
  players: Record<PlayerId, PlayerState>;
  lanes: Lane[];
  currentTurn: PlayerId;
  round: number;
  winner: Winner;
  lastAction: Action | null;
}

export type PlayCardAction = {
  type: 'play-card';
  playerId: PlayerId;
  cardUid: string;
  laneIndex: number;
};

export type EndTurnAction = {
  type: 'end-turn';
  playerId: PlayerId;
};

export type Action = PlayCardAction | EndTurnAction;
