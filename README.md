# cardlane

cardlane is a SvelteKit and TypeScript prototype for a lane-based card battler. It currently has a playable single-player loop against a simple AI opponent, a lightweight deckbuilder, a pure TypeScript rules engine, and Vitest coverage for the core game flow.

The game is still a prototype, but it has moved beyond repo setup notes: you can build a 14-card deck, queue cards face-down into five lanes, lock turns, reveal both sides, resolve lane effects, and play until a hero wins.

## Current features

- Mobile-friendly Svelte UI with deckbuilder and battle modes.
- Five-lane board with separate player and opponent slots.
- Fixed card library with Sea and Forest factions.
- Custom player deck selection with a 14-card deck size and a maximum of 2 copies per card.
- Simple AI that chooses from legal opponent actions.
- Face-down planning phase followed by an explicit reveal step.
- Staged round playback for reveal, movement, pushes, drown effects, combat, growth, and next-round setup.
- Deck exhaustion fatigue: a hero takes 1 damage when they cannot draw for the next round.
- Keyword descriptions in the deckbuilder and tooltips on card keyword chips.
- Pure TypeScript game state, rules, selectors, card definitions, and AI helpers under `src/lib/game`.
- Unit tests for lane setup, legal action handling, reveal timing, terrain, keyword interactions, staged resolution snapshots, and combat-adjacent effects.

## Tech stack

- SvelteKit
- Svelte 5
- TypeScript
- Vite
- Vitest
- ESLint
- Prettier

## Getting started

Install dependencies:

```sh
npm install
```

Run the development server:

```sh
npm run dev
```

Run the test suite:

```sh
npm test
```

Run type and Svelte checks:

```sh
npm run check
```

Run linting and formatting checks:

```sh
npm run lint
```

Build for production:

```sh
npm run build
```

Preview a production build:

```sh
npm run preview
```

## Project structure

```text
src/
  lib/
    components/
      Board.svelte          Battle board layout
      Card.svelte           Visible card presentation
      FaceDownCard.svelte   Queued card back
      Hand.svelte           Player hand
      HeroPanel.svelte      Hero health and mana
      Lane.svelte           Lane slot and terrain UI
    game/
      ai.ts                 Simple legal-action AI
      cards.ts              Card library and deck validation
      keywords.ts           Keyword labels and player-facing help text
      rules.ts              Legal actions and round resolution
      rules.test.ts         Rules engine tests
      selectors.ts          Derived game-state helpers
      state.ts              Initial state, cloning, draw, shuffle
      types.ts              Core game types
  routes/
    +page.svelte            Deckbuilder and main game screen
```

## Gameplay model

Each player starts with 30 hero health, 3 mana, a 14-card deck, and a 4-card hand. Mana increases by 1 each round up to 10. Both players queue cards into lanes during planning, then the round pauses until the reveal button is pressed.

Round resolution currently runs in this order:

1. Reveal queued cards.
2. Resolve Tide movement.
3. Resolve Current pushes.
4. Resolve Drown effects.
5. Resolve combat and hero damage.
6. Resolve Growth effects.
7. Refresh mana, draw cards, apply deck exhaustion fatigue, and start the next round.

The current card mechanics include faction terrain, Flooded, Overgrown, Mud, Current, School, Tide, Surge, Drown, Rooted, Grow, Canopy, Thorns, and Seed. Terrain and keyword behavior is implemented in `src/lib/game/rules.ts`.

## Architecture notes

The rules engine is intentionally separate from Svelte. UI components render `GameState` and dispatch player intentions, while `rules.ts` validates actions and returns the next state. This keeps game behavior testable without a browser and makes it easier to add better AI, multiplayer, or alternate front ends later.

Most gameplay objects are immutable from the caller's perspective: public rule helpers clone state before applying changes. The resolver also exposes staged snapshots through `getRoundResolutionSteps`, which the Svelte UI uses for reveal playback.

## Areas for improvement

- Add a fuller rules reference or glossary view beyond inline keyword descriptions.
- Expand tests for remaining edge cases around simultaneous deaths, seed spawning conflicts, blocked movement, and win conditions.
- Improve AI beyond random legal plays so it considers mana efficiency, lane pressure, lethal damage, and terrain synergies.
- Add more visual feedback and accessibility polish for selected cards, legal lanes, reveal steps, and disabled actions.
- Persist deckbuilder choices locally so custom decks survive a refresh.
- Consider extracting deckbuilder state and battle orchestration from `+page.svelte` as the UI grows.
- Add regression coverage for Svelte interactions with component tests or browser-level tests.
- Review card balance now that the game has five lanes, multiple plays per turn, and several scaling mechanics.

## Future work

- More cards, factions, and effect types once the current rules are stable.
- Better onboarding, rules reference, and match summary screens.
- Animation and audio polish after the core loop feels good.
- PWA support for easier phone play on a home network.
- Local multiplayer with an authoritative server and WebSockets. The likely model is to sync player actions and canonical game state, not UI events.
- Optional deck import/export or saved deck presets.

## License

MIT. See `LICENSE`.
