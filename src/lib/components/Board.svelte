<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import Hand from './Hand.svelte';
  import HeroPanel from './HeroPanel.svelte';
  import Lane from './Lane.svelte';
  import type { GameState } from '$lib/game/types';

  export let state: GameState;
  export let playableCardIds: string[] = [];
  export let selectedCardUid: string | null = null;

  const dispatch = createEventDispatcher<{
    cardSelected: { cardUid: string };
    laneSelected: { laneIndex: number };
  }>();
</script>

<div class="board">
  <HeroPanel
    name={state.players.opponent.name}
    health={state.players.opponent.heroHealth}
    mana={state.players.opponent.mana}
    maxMana={state.players.opponent.maxMana}
    active={state.currentTurn === 'opponent'}
  />

  <div class="board__opponent-hand">Opponent hand: {state.players.opponent.hand.length} cards</div>

  <div class="board__lanes">
    {#each state.lanes as lane (lane.index)}
      <Lane lane={lane} {selectedCardUid} on:laneSelected={(event) => dispatch('laneSelected', event.detail)} />
    {/each}
  </div>

  <HeroPanel
    name={state.players.player.name}
    health={state.players.player.heroHealth}
    mana={state.players.player.mana}
    maxMana={state.players.player.maxMana}
    active={state.currentTurn === 'player'}
  />

  <Hand
    cards={state.players.player.hand}
    {playableCardIds}
    {selectedCardUid}
    on:cardSelected={(event) => dispatch('cardSelected', event.detail)}
  />
</div>

<style>
  .board {
    display: grid;
    gap: 1rem;
  }

  .board__opponent-hand {
    color: #c9d7ff;
    font-size: 0.9rem;
  }

  .board__lanes {
    display: grid;
    gap: 0.85rem;
  }

  @media (min-width: 700px) {
    .board__lanes {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
  }
</style>
