<script lang="ts">
  import type { Card as GameCard } from '$lib/game/types';

  export let card: GameCard;
  export let playable = false;
  export let selected = false;

  const effectLabels: Record<string, string> = {
    'damage-enemy-hero': 'Deal 1 to enemy hero',
    'gain-mana': 'Gain 1 mana'
  };
</script>

<div class:selected class:playable class="card">
  <div class="card__header">
    <span class="card__name">{card.name}</span>
    <span class="card__cost">{card.cost}</span>
  </div>
  <div class="card__stats">
    <span>⚔ {card.attack}</span>
    <span>❤ {card.currentHealth}</span>
  </div>
  {#if card.effect}
    <p class="card__effect">{effectLabels[card.effect.type]}</p>
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

  .card__effect {
    margin: 0;
    font-size: 0.8rem;
    color: #c9d7ff;
  }
</style>
