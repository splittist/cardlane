import type { CardKeywords } from './types';

type KeywordKey = keyof CardKeywords;

interface KeywordHelp {
	label: string;
	description: string;
}

export const KEYWORD_HELP: Record<KeywordKey, KeywordHelp> = {
	current: {
		label: 'Current',
		description:
			'When this card enters against an enemy, push that enemy sideways by this value if possible.'
	},
	school: {
		label: 'School',
		description:
			'Gets +1 attack for each adjacent friendly card that also has School.'
	},
	tide: {
		label: 'Tide',
		description:
			'Before combat, moves to a nearby open lane, preferring lanes with enemies or friendly terrain.'
	},
	surge: {
		label: 'Surge',
		description:
			'Gets bonus attack equal to this value during the round it enters.'
	},
	drown: {
		label: 'Drown',
		description:
			'Before combat on flooded terrain, destroys the opposing card in this lane.'
	},
	rooted: {
		label: 'Rooted',
		description: 'Cannot be moved by Tide or Current.'
	},
	grow: {
		label: 'Grow',
		description: 'At the end of the round, gains +1 attack and +1 health.'
	},
	canopy: {
		label: 'Canopy',
		description: 'Adjacent friendly cards take 1 less combat damage.'
	},
	thorns: {
		label: 'Thorns',
		description: 'When fighting a card, deals this much extra damage back.'
	},
	seed: {
		label: 'Seed',
		description:
			'When this card dies, queues a 1/1 Sapling in its lane for the next round.'
	}
};

export function formatKeywordName(
	keyword: string,
	value: boolean | number
): string {
	const label = KEYWORD_HELP[keyword as KeywordKey]?.label ?? keyword;

	return `${label}${typeof value === 'number' ? ` ${value}` : ''}`;
}

export function describeKeyword(
	keyword: string,
	value: boolean | number
): string {
	const help = KEYWORD_HELP[keyword as KeywordKey];
	const label = formatKeywordName(keyword, value);

	if (!help) {
		return label;
	}

	return `${label}: ${help.description}`;
}

export function formatKeywordList(
	keywords: CardKeywords | undefined
): string[] {
	return Object.entries(keywords ?? {})
		.filter(([, value]) => Boolean(value))
		.map(([keyword, value]) => describeKeyword(keyword, value));
}
