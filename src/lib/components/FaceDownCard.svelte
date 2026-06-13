<script lang="ts">
  export let owner: 'player' | 'opponent';
  export let label = 'Face-down';
</script>

<div class:opponent={owner === 'opponent'} class="card-back" aria-label={label}>
  <div class="card-back__sigil">◈</div>
  <div class="card-back__label">{label}</div>
</div>

<style>
  .card-back {
    display: grid;
    gap: 0.35rem;
    place-items: center;
    min-width: 7rem;
    border: 2px solid #5577bd;
    border-radius: 0.85rem;
    background:
      radial-gradient(circle at top, rgb(131 178 255 / 0.18), transparent 55%),
      linear-gradient(180deg, #22345b, #0f1730);
    padding: 0.9rem 0.75rem;
    color: #edf3ff;
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.05);
  }

  .card-back.opponent {
    border-color: #79b28d;
    background:
      radial-gradient(circle at top, rgb(160 232 183 / 0.14), transparent 55%),
      linear-gradient(180deg, #203d33, #0f221d);
  }

  .card-back__sigil {
    font-size: 1.35rem;
    line-height: 1;
  }

  .card-back__label {
    font-size: 0.75rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
</style>