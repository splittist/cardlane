import { getLegalActions } from './rules';
import type { Action, GameState } from './types';

export function chooseAiAction(
	state: GameState,
	rng: () => number = Math.random
): Action {
	const legalActions = getLegalActions(state, 'opponent');
	const playActions = legalActions.filter(
		(action): action is Extract<Action, { type: 'play-card' }> =>
			action.type === 'play-card'
	);
	const actionPool = playActions.length > 0 ? playActions : legalActions;

	if (actionPool.length === 0) {
		return { type: 'end-turn', playerId: 'opponent' };
	}

	return actionPool[Math.floor(rng() * actionPool.length)];
}
