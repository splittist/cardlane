<script lang="ts">
  import Board from '$lib/components/Board.svelte';
  import { chooseAiAction } from '$lib/game/ai';
  import { applyAction, getLegalActions } from '$lib/game/rules';
  import { getPlayableCards } from '$lib/game/selectors';
  import { createInitialState } from '$lib/game/state';
  import type { GameState } from '$lib/game/types';

  let state: GameState = createInitialState();
  let selectedCardUid: string | null = null;

  $: playableCardIds = getPlayableCards(state, 'player').map((card) => card.uid);
  $: legalPlayerActions = getLegalActions(state, 'player');
  $: playerTurn = state.currentTurn === 'player' && !state.winner;
  $: if (selectedCardUid && !state.players.player.hand.some((card) => card.uid === selectedCardUid)) {
    selectedCardUid = null;
  }

  function handleCardSelected(event: CustomEvent<{ cardUid: string }>): void {
    const { cardUid } = event.detail;

    if (!playerTurn || !playableCardIds.includes(cardUid)) {
      return;
    }

    selectedCardUid = selectedCardUid === cardUid ? null : cardUid;
  }

  function handleLaneSelected(event: CustomEvent<{ laneIndex: number }>): void {
    if (!selectedCardUid || !playerTurn) {
      return;
    }

    const { laneIndex } = event.detail;
    const isLegalPlay = legalPlayerActions.some(
      (action) =>
        action.type === 'play-card' && action.cardUid === selectedCardUid && action.laneIndex === laneIndex
    );

    if (!isLegalPlay) {
      return;
    }

    state = applyAction(state, {
      type: 'play-card',
      playerId: 'player',
      cardUid: selectedCardUid,
      laneIndex
    });
    selectedCardUid = null;
  }

  function runOpponentTurn(): void {
    while (state.currentTurn === 'opponent' && !state.winner) {
      state = applyAction(state, chooseAiAction(state));
    }
  }

  function endTurn(): void {
    if (!playerTurn) {
      return;
    }

    selectedCardUid = null;
    state = applyAction(state, { type: 'end-turn', playerId: 'player' });
    runOpponentTurn();
  }

  function resetGame(): void {
    state = createInitialState();
    selectedCardUid = null;
  }
</script>

<svelte:head>
  <title>cardlane</title>
  <meta
    name="description"
    content="Lane-based card battler prototype built with SvelteKit and a pure TypeScript game engine."
  />
</svelte:head>

<div class="page">
  <header class="page__header">
    <div>
      <h1>cardlane</h1>
      <p>Round {state.round} · Combat resolves after both sides finish their turn.</p>
    </div>
    <div class="page__actions">
      <button class="primary" type="button" on:click={endTurn} disabled={!playerTurn}>End turn</button>
      <button type="button" on:click={resetGame}>New game</button>
    </div>
  </header>

  {#if state.winner}
    <section class="status">
      <strong>
        {#if state.winner === 'draw'}
          It's a draw.
        {:else if state.winner === 'player'}
          You win!
        {:else}
          The AI wins.
        {/if}
      </strong>
      <span>Start a new game to play again.</span>
    </section>
  {:else if playerTurn}
    <section class="status">
      <strong>Your turn.</strong>
      <span>Select a playable card, then tap an open lane.</span>
    </section>
  {:else}
    <section class="status">
      <strong>AI turn.</strong>
      <span>The opponent is taking actions.</span>
    </section>
  {/if}

  <Board {state} {playableCardIds} {selectedCardUid} on:cardSelected={handleCardSelected} on:laneSelected={handleLaneSelected} />
</div>

<style>
  :global(body) {
    margin: 0;
    background: #0a1020;
    color: #f7f9ff;
    font-family: Arial, Helvetica, sans-serif;
  }

  .page {
    min-height: 100vh;
    display: grid;
    gap: 1rem;
    padding: 1rem;
    box-sizing: border-box;
  }

  .page__header {
    display: grid;
    gap: 0.75rem;
  }

  .page__header h1,
  .page__header p {
    margin: 0;
  }

  .page__actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  button {
    border: 1px solid #4562a5;
    border-radius: 999px;
    background: #18233f;
    color: inherit;
    padding: 0.7rem 1rem;
    font: inherit;
  }

  button.primary {
    background: #355cde;
    border-color: #5d7ef5;
  }

  button:disabled {
    opacity: 0.5;
  }

  .status {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    border: 1px solid #395084;
    border-radius: 1rem;
    background: #11182e;
    padding: 0.9rem 1rem;
  }

  @media (min-width: 700px) {
    .page {
      max-width: 1100px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    .page__header {
      align-items: center;
      grid-template-columns: 1fr auto;
    }
  }
</style>
