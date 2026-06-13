<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import Card from './Card.svelte';
	import type { Card as GameCard } from '$lib/game/types';

	export let cards: GameCard[] = [];
	export let playableCardIds: string[] = [];
	export let selectedCardUid: string | null = null;

	const dispatch = createEventDispatcher<{
		cardSelected: { cardUid: string };
	}>();
</script>

<div class="hand">
	{#each cards as card (card.uid)}
		<button
			class="hand__button"
			type="button"
			on:click={() => dispatch('cardSelected', { cardUid: card.uid })}
		>
			<Card
				{card}
				playable={playableCardIds.includes(card.uid)}
				selected={selectedCardUid === card.uid}
			/>
		</button>
	{/each}
</div>

<style>
	.hand {
		display: flex;
		gap: 0.75rem;
		overflow-x: auto;
		padding-bottom: 0.5rem;
	}

	.hand__button {
		border: 0;
		background: transparent;
		padding: 0;
		text-align: left;
	}
</style>
