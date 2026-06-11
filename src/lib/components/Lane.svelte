<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import Card from './Card.svelte';
  import { getLaneWinner } from '$lib/game/selectors';
  import type { Lane as GameLane } from '$lib/game/types';

  export let lane: GameLane;
  export let selectedCardUid: string | null = null;

  const dispatch = createEventDispatcher<{ laneSelected: { laneIndex: number } }>();
  $: laneState = getLaneWinner(lane);
  $: isSelectable = selectedCardUid !== null && lane.playerCard === null;
  $: terrainLabel = lane.terrain ? lane.terrain : 'none';
</script>

<button class:selectable={isSelectable} class="lane" type="button" on:click={() => dispatch('laneSelected', { laneIndex: lane.index })}>
  <div class="lane__label">Lane {lane.index + 1}</div>
  <div class="lane__terrain">Terrain: {terrainLabel}</div>
  <div class="lane__slot lane__slot--top">
    {#if lane.opponentCard}
      <Card card={lane.opponentCard} />
    {:else}
      <span>Open</span>
    {/if}
  </div>
  <div class="lane__state">{laneState}</div>
  <div class="lane__slot lane__slot--bottom">
    {#if lane.playerCard}
      <Card card={lane.playerCard} />
    {:else}
      <span>{selectedCardUid ? 'Tap to play here' : 'Open'}</span>
    {/if}
  </div>
</button>

<style>
  .lane {
    display: grid;
    gap: 0.75rem;
    width: 100%;
    border: 1px solid #34456f;
    border-radius: 1rem;
    background: rgb(13 19 35 / 0.95);
    padding: 0.85rem;
    color: #f1f4ff;
    text-align: center;
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

  .lane__slot {
    min-height: 7.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed #486197;
    border-radius: 0.85rem;
    padding: 0.5rem;
  }
</style>
