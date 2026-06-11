<script lang="ts">
  import type { Card as GameCard } from '$lib/game/types';

  export let card: GameCard;
  export let playable = false;
  export let selected = false;

  const keywordLabels: Record<string, string> = {
    current: 'Current',
    school: 'School',
    tide: 'Tide',
    surge: 'Surge',
    drown: 'Drown',
    rooted: 'Rooted',
    grow: 'Grow',
    canopy: 'Canopy',
    thorns: 'Thorns',
    seed: 'Seed'
  };

  $: keywordEntries = Object.entries(card.keywords ?? {}).filter(([, value]) => Boolean(value));
</script>

<div class:selected class:playable class="card">
  <div class="card__header">
    <span class="card__name">{card.name}</span>
    <span class="card__cost">{card.cost}</span>
  </div>
  <div class="card__art" aria-hidden="true">
    <svg viewBox="0 0 48 48" role="img">
      <text x="50%" y="58%" text-anchor="middle" font-size="28">{card.art}</text>
    </svg>
  </div>
  <div class="card__stats">
    <span>⚔ {card.attack}</span>
    <span>❤ {card.currentHealth}</span>
  </div>
  {#if keywordEntries.length > 0}
    <div class="card__keywords">
      {#each keywordEntries as [keyword, value] (keyword)}
        <span>
          {keywordLabels[keyword] ?? keyword}{typeof value === 'number' ? ` ${value}` : ''}
        </span>
      {/each}
    </div>
  {/if}
</div>

<style>
  .card {
    display: flex;
    min-width: 7rem;
    flex-direction: column;
    gap: 0.35rem;
    border: 2px solid #2f3e67;
    border-radius: 0.85rem;
    background: linear-gradient(180deg, #18233f, #11182e);
    padding: 0.75rem;
    color: #f7f9ff;
    box-shadow: 0 0.45rem 1rem rgb(4 10 24 / 0.25);
    transition: transform 0.15s ease, border-color 0.15s ease;
  }

  .card.playable {
    border-color: #7be495;
  }

  .card.selected {
    transform: translateY(-0.2rem);
    border-color: #ffd166;
  }

  .card__header,
  .card__stats {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .card__art {
    display: grid;
    place-items: center;
    min-height: 2.6rem;
  }

  .card__art svg {
    width: 2.2rem;
    height: 2.2rem;
  }

  .card__name {
    font-weight: 700;
  }

  .card__cost {
    display: inline-flex;
    min-width: 1.75rem;
    justify-content: center;
    border-radius: 999px;
    background: #355cde;
    padding: 0.15rem 0.5rem;
    font-weight: 700;
  }

  .card__keywords {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .card__keywords span {
    border: 1px solid #4662a0;
    border-radius: 999px;
    padding: 0.1rem 0.35rem;
    font-size: 0.72rem;
    color: #d7e4ff;
  }
</style>
