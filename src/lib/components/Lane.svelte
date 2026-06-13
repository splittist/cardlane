<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	import Card from './Card.svelte';
	import FaceDownCard from './FaceDownCard.svelte';
	import { getLaneWinner } from '$lib/game/selectors';
	import type { Lane as GameLane } from '$lib/game/types';

	export let lane: GameLane;
	export let selectedCardUid: string | null = null;
	export let showPlayerPendingReveal = false;
	export let showOpponentPendingReveal = false;

	const dispatch = createEventDispatcher<{
		laneSelected: { laneIndex: number };
	}>();
	$: laneState = getLaneWinner(lane);
	$: isSelectable = selectedCardUid !== null && lane.playerCard === null;
	$: terrainLabel = lane.terrain ? lane.terrain : 'none';
	$: terrainClass = lane.terrain ? `lane--${lane.terrain}` : 'lane--none';
</script>

<button
	class:selectable={isSelectable}
	class={`lane ${terrainClass}`}
	type="button"
	on:click={() => dispatch('laneSelected', { laneIndex: lane.index })}
>
	<div class="lane__label">Lane {lane.index + 1}</div>
	{#key `${lane.terrain ?? 'none'}:${lane.index}`}
		<div
			class="lane__terrain"
			in:scale={{ duration: 220, start: 0.92 }}
			out:fade={{ duration: 140 }}
		>
			Terrain: {terrainLabel}
		</div>
	{/key}
	<div class="lane__slot lane__slot--top">
		{#key `${lane.opponentCard?.uid ?? 'open'}:${lane.opponentCard?.currentHealth ?? 0}:${showOpponentPendingReveal ? 'queued' : 'clear'}`}
			<div
				class="lane__slot-content"
				in:scale={{ duration: 180, start: 0.92 }}
				out:fade={{ duration: 120 }}
			>
				{#if lane.opponentCard}
					<Card card={lane.opponentCard} />
				{:else if showOpponentPendingReveal}
					<FaceDownCard owner="opponent" label="Queued" />
				{:else}
					<span>Open</span>
				{/if}
			</div>
		{/key}
	</div>
	<div class="lane__state">{laneState}</div>
	<div class="lane__slot lane__slot--bottom">
		{#key `${lane.playerCard?.uid ?? 'open'}:${lane.playerCard?.currentHealth ?? 0}:${showPlayerPendingReveal ? 'queued' : 'clear'}`}
			<div
				class="lane__slot-content"
				in:scale={{ duration: 180, start: 0.92 }}
				out:fade={{ duration: 120 }}
			>
				{#if lane.playerCard}
					<Card card={lane.playerCard} />
				{:else if showPlayerPendingReveal}
					<FaceDownCard owner="player" label="Queued" />
				{:else}
					<span>{selectedCardUid ? 'Tap to play here' : 'Open'}</span>
				{/if}
			</div>
		{/key}
	</div>
</button>

<style>
	.lane {
		position: relative;
		overflow: hidden;
		display: grid;
		gap: 0.75rem;
		width: 100%;
		border: 1px solid #34456f;
		border-radius: 1rem;
		background: rgb(13 19 35 / 0.95);
		padding: 0.85rem;
		color: #f1f4ff;
		text-align: center;
		transition:
			background 320ms ease,
			border-color 260ms ease,
			box-shadow 280ms ease;
	}

	.lane::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0;
		z-index: 0;
	}

	.lane > * {
		position: relative;
		z-index: 1;
	}

	.lane--none {
		background: rgb(13 19 35 / 0.95);
	}

	.lane--flooded {
		border-color: #4a89de;
		background: linear-gradient(
			180deg,
			rgb(10 36 78 / 0.92),
			rgb(12 29 58 / 0.95)
		);
		box-shadow: 0 0 0 1px rgb(74 137 222 / 0.3);
	}

	.lane--flooded::after {
		opacity: 1;
		background: radial-gradient(
			circle at 50% 15%,
			rgb(118 176 255 / 0.32),
			transparent 65%
		);
		animation: terrain-pulse 560ms ease-out;
	}

	.lane--overgrown {
		border-color: #4cb07a;
		background: linear-gradient(
			180deg,
			rgb(24 54 36 / 0.92),
			rgb(13 33 20 / 0.95)
		);
		box-shadow: 0 0 0 1px rgb(76 176 122 / 0.3);
	}

	.lane--overgrown::after {
		opacity: 1;
		background: radial-gradient(
			circle at 50% 15%,
			rgb(137 236 164 / 0.24),
			transparent 66%
		);
		animation: terrain-pulse 560ms ease-out;
	}

	.lane--mud {
		border-color: #8b6b4a;
		background: linear-gradient(
			180deg,
			rgb(59 38 23 / 0.92),
			rgb(33 22 14 / 0.95)
		);
		box-shadow: 0 0 0 1px rgb(139 107 74 / 0.3);
	}

	.lane--mud::after {
		opacity: 1;
		background: radial-gradient(
			circle at 50% 15%,
			rgb(196 156 110 / 0.22),
			transparent 66%
		);
		animation: terrain-pulse 560ms ease-out;
	}

	.lane.selectable {
		border-color: #ffd166;
	}

	.lane__label,
	.lane__state {
		text-transform: capitalize;
		font-size: 0.85rem;
		color: #c9d7ff;
	}

	.lane__terrain {
		text-transform: capitalize;
		font-size: 0.82rem;
		color: #d6e2ff;
		letter-spacing: 0.02em;
	}

	.lane__slot {
		min-height: 7.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px dashed #486197;
		border-radius: 0.85rem;
		padding: 0.5rem;
	}

	.lane__slot-content {
		display: flex;
		width: 100%;
		justify-content: center;
	}

	@keyframes terrain-pulse {
		from {
			transform: scale(1.02);
			opacity: 0.75;
		}

		to {
			transform: scale(1);
			opacity: 0;
		}
	}
</style>
