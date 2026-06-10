<script lang="ts">
  export let name: string;
  export let health: number;
  export let mana = 0;
  export let maxMana = 0;
  export let active = false;
</script>

<section class:active class="hero-panel">
  <h2>{name}</h2>
  <div class="hero-panel__stats">
    <span>❤ {health}</span>
    <span>✦ {mana}/{maxMana}</span>
  </div>
</section>

<style>
  .hero-panel {
    display: grid;
    gap: 0.4rem;
    border: 1px solid #395084;
    border-radius: 1rem;
    background: #11182e;
    padding: 0.9rem 1rem;
  }

  .hero-panel.active {
    border-color: #7be495;
  }

  h2 {
    margin: 0;
    font-size: 1rem;
  }

  .hero-panel__stats {
    display: flex;
    gap: 1rem;
    color: #dbe4ff;
  }
</style>
