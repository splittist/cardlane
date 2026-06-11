<script lang="ts">
  import Board from '$lib/components/Board.svelte';
  import { CARD_LIBRARY, DECK_SIZE, MAX_COPIES_PER_CARD, STARTING_DECK } from '$lib/game/cards';
  import { chooseAiAction } from '$lib/game/ai';
  import { applyAction, getLegalActions } from '$lib/game/rules';
  import { getPlayableCards } from '$lib/game/selectors';
  import { createInitialState } from '$lib/game/state';
  import type { GameState } from '$lib/game/types';

  type Mode = 'deckbuilder' | 'battle';

  let mode: Mode = 'deckbuilder';
  let selectedDeckDefinition: string[] = [...STARTING_DECK];
  let state: GameState = createInitialState({ playerDeckDefinition: selectedDeckDefinition });
  let selectedCardUid: string | null = null;

  $: playableCardIds = getPlayableCards(state, 'player').map((card) => card.uid);
  $: legalPlayerActions = getLegalActions(state, 'player');
  $: playerTurn = state.currentTurn === 'player' && !state.winner;
  $: deckCardCount = selectedDeckDefinition.length;
  $: isDeckValid = deckCardCount === DECK_SIZE;
  $: copiesByCardId = selectedDeckDefinition.reduce<Record<string, number>>((counts, cardId) => {
    counts[cardId] = (counts[cardId] ?? 0) + 1;
    return counts;
  }, {});
  $: selectedDeckSummary = CARD_LIBRARY.filter((card) => copiesByCardId[card.id]).map((card) => ({
    card,
    copies: copiesByCardId[card.id]
  }));
  $: keywordTextByCardId = CARD_LIBRARY.reduce<Record<string, string>>((acc, card) => {
    const keywords = Object.entries(card.keywords ?? {})
      .filter(([, value]) => Boolean(value))
      .map(([keyword, value]) => `${keyword}${typeof value === 'number' ? ` ${value}` : ''}`);

    acc[card.id] = keywords.join(', ');
    return acc;
  }, {});

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
    if (!playerTurn || mode !== 'battle') {
      return;
    }

    selectedCardUid = null;
    state = applyAction(state, { type: 'end-turn', playerId: 'player' });
    runOpponentTurn();
  }

  function startBattle(): void {
    if (!isDeckValid) {
      return;
    }

    state = createInitialState({ playerDeckDefinition: selectedDeckDefinition });
    mode = 'battle';
    selectedCardUid = null;
  }

  function resetBattle(): void {
    state = createInitialState({ playerDeckDefinition: selectedDeckDefinition });
    selectedCardUid = null;
  }

  function openDeckbuilder(): void {
    mode = 'deckbuilder';
    selectedCardUid = null;
  }

  function addCardToDeck(cardId: string): void {
    const copies = copiesByCardId[cardId] ?? 0;

    if (selectedDeckDefinition.length >= DECK_SIZE || copies >= MAX_COPIES_PER_CARD) {
      return;
    }

    selectedDeckDefinition = [...selectedDeckDefinition, cardId];
  }

  function removeCardFromDeck(cardId: string): void {
    const cardIndex = selectedDeckDefinition.findIndex((entry) => entry === cardId);

    if (cardIndex === -1) {
      return;
    }

    selectedDeckDefinition = selectedDeckDefinition.filter((_, index) => index !== cardIndex);
  }

  function resetDeck(): void {
    selectedDeckDefinition = [...STARTING_DECK];
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
      {#if mode === 'battle'}
        <p>Round {state.round} · Reveal → moves → pushes → combat → growth.</p>
      {:else}
        <p>Build your Sea-vs-Forest deck before the match starts.</p>
      {/if}
    </div>
    <div class="page__actions">
      {#if mode === 'battle'}
        <button class="primary" type="button" on:click={endTurn} disabled={!playerTurn}>End turn</button>
        <button type="button" on:click={resetBattle}>New game</button>
        <button type="button" on:click={openDeckbuilder}>Deckbuilder</button>
      {:else}
        <button class="primary" type="button" on:click={startBattle} disabled={!isDeckValid}>Start battle</button>
        <button type="button" on:click={resetDeck}>Reset deck</button>
      {/if}
    </div>
  </header>

  {#if mode === 'battle'}
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
  {:else}
    <section class="status">
      <strong>Deck size: {deckCardCount}/{DECK_SIZE}</strong>
      <span>Use up to {MAX_COPIES_PER_CARD} copies per card across five lanes.</span>
    </section>

    <section class="deckbuilder" aria-label="Deckbuilder">
      <div class="deckbuilder__library">
        <h2>Card library</h2>
        <div class="library-grid">
          {#each CARD_LIBRARY as card (card.id)}
            {@const copies = copiesByCardId[card.id] ?? 0}
            {@const canAdd = copies < MAX_COPIES_PER_CARD && deckCardCount < DECK_SIZE}
            <article class="library-card">
              <header>
                <strong>{card.art} {card.name}</strong>
                <span>Cost {card.cost}</span>
              </header>
              <div class="library-card__stats">
                <span>{card.faction === 'sea' ? 'Sea' : 'Forest'}</span>
                <span>⚔ {card.attack}</span>
                <span>❤ {card.health}</span>
              </div>
              {#if card.createsTerrain}
                <p>Creates {card.createsTerrain} terrain.</p>
              {/if}
              {#if keywordTextByCardId[card.id]}
                <p>Keywords: {keywordTextByCardId[card.id]}</p>
              {/if}
              <footer>
                <span>{copies}/{MAX_COPIES_PER_CARD}</span>
                <div class="library-card__actions">
                  <button type="button" on:click={() => removeCardFromDeck(card.id)} disabled={copies === 0}>-</button>
                  <button type="button" on:click={() => addCardToDeck(card.id)} disabled={!canAdd}>+</button>
                </div>
              </footer>
            </article>
          {/each}
        </div>
      </div>

      <aside class="deckbuilder__summary">
        <h2>Your deck</h2>
        {#if selectedDeckSummary.length > 0}
          <ul>
            {#each selectedDeckSummary as entry (entry.card.id)}
              <li>
                <span>{entry.card.name}</span>
                <strong>x{entry.copies}</strong>
              </li>
            {/each}
          </ul>
        {:else}
          <p>Add cards from the library to build your deck.</p>
        {/if}
      </aside>
    </section>
  {/if}
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

  h2 {
    margin: 0;
    font-size: 1rem;
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

  .deckbuilder {
    display: grid;
    gap: 1rem;
  }

  .deckbuilder__library,
  .deckbuilder__summary {
    display: grid;
    gap: 0.8rem;
    border: 1px solid #395084;
    border-radius: 1rem;
    background: #11182e;
    padding: 1rem;
  }

  .library-grid {
    display: grid;
    gap: 0.75rem;
  }

  .library-card {
    display: grid;
    gap: 0.55rem;
    border: 1px solid #34456f;
    border-radius: 0.8rem;
    background: rgb(13 19 35 / 0.95);
    padding: 0.75rem;
  }

  .library-card header,
  .library-card footer,
  .library-card__stats,
  .library-card__actions {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    align-items: center;
  }

  .library-card p {
    margin: 0;
    color: #c9d7ff;
    font-size: 0.85rem;
  }

  .library-card__actions button {
    min-width: 2rem;
    padding: 0.35rem 0.5rem;
    border-radius: 0.6rem;
  }

  .deckbuilder__summary ul {
    display: grid;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .deckbuilder__summary li {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    border-bottom: 1px solid #2b3a5f;
    padding-bottom: 0.35rem;
  }

  .deckbuilder__summary p {
    margin: 0;
    color: #c9d7ff;
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

    .library-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .deckbuilder {
      grid-template-columns: 2fr minmax(16rem, 1fr);
      align-items: start;
    }
  }

  @media (min-width: 1000px) {
    .library-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
</style>
