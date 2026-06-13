export type PlayerId = 'player' | 'opponent';
export type Winner = PlayerId | 'draw' | null;
export type Faction = 'sea' | 'forest';
export type TerrainType = 'flooded' | 'overgrown' | 'mud';
export type RoundPhase = 'planning' | 'reveal-ready';

export interface CardKeywords {
	current?: number;
	school?: boolean;
	tide?: boolean;
	surge?: number;
	drown?: boolean;
	rooted?: boolean;
	grow?: boolean;
	canopy?: boolean;
	thorns?: number;
	seed?: boolean;
}

export interface CardDefinition {
	id: string;
	name: string;
	art: string;
	faction: Faction;
	cost: number;
	attack: number;
	health: number;
	keywords?: CardKeywords;
	createsTerrain?: TerrainType;
}

export interface Card extends CardDefinition {
	uid: string;
	owner: PlayerId;
	currentHealth: number;
	enteredThisRound: boolean;
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
	terrain: TerrainType | null;
	playerCard: Card | null;
	opponentCard: Card | null;
	pendingSeed: PlayerId[];
}

export interface PendingReveal {
	laneIndex: number;
	card: Card;
}

export interface GameState {
	players: Record<PlayerId, PlayerState>;
	lanes: Lane[];
	currentTurn: PlayerId;
	phase: RoundPhase;
	round: number;
	winner: Winner;
	lastAction: Action | null;
	pendingReveal: Record<PlayerId, PendingReveal[]>;
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
