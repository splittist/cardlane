import { describe, expect, it } from 'vitest';

import {
	describeKeyword,
	formatKeywordList,
	formatKeywordName
} from './keywords';

describe('keyword help', () => {
	it('formats keyword labels with numeric values', () => {
		expect(formatKeywordName('current', 1)).toBe('Current 1');
		expect(formatKeywordName('tide', true)).toBe('Tide');
	});

	it('describes known keywords for UI help', () => {
		expect(describeKeyword('drown', true)).toBe(
			'Drown: Before combat on flooded terrain, destroys the opposing card in this lane.'
		);
		expect(describeKeyword('thorns', 2)).toBe(
			'Thorns 2: When fighting a card, deals this much extra damage back.'
		);
	});

	it('formats a card keyword list and omits inactive values', () => {
		expect(
			formatKeywordList({ current: 1, school: true, tide: false })
		).toEqual([
			'Current 1: When this card enters against an enemy, push that enemy sideways by this value if possible.',
			'School: Gets +1 attack for each adjacent friendly card that also has School.'
		]);
	});

	it('falls back gracefully for unknown keywords', () => {
		expect(describeKeyword('mystery', 3)).toBe('mystery 3');
	});
});
