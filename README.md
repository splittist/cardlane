# cardlane

Lane Card Game Repo Setup

This project is a small SvelteKit/TypeScript web app for building a lane-based card battler playable on phones over a home network. The first goal is a single-player prototype with a simple AI opponent. Local multiplayer can be added later once the rules engine is stable.

Technical approach

Use SvelteKit for the web app, TypeScript for both UI and game logic, and Vitest for testing the rules engine. The core game should be written as framework-independent TypeScript so that the rules, card definitions, and AI are not tightly coupled to Svelte components.

The UI should render game state and dispatch player actions. It should not contain the rules themselves. The game engine should be responsible for validating legal actions, applying those actions, resolving combat, and returning the next game state.

Suggested tooling

The initial tooling should be:

* SvelteKit
* TypeScript
* Vite
* Vitest
* ESLint / Prettier
* JSON or TypeScript card definitions
* Optional later: PWA support
* Optional later: Node/WebSocket server for two-player home-network play

Suggested project skeleton

src/
  lib/
    game/
      cards.ts          # Card definitions
      types.ts          # Core types: Card, Player, Lane, GameState, Action
      state.ts          # Initial state, deck setup, draw/shuffle helpers
      rules.ts          # Legal moves, action resolution, combat
      ai.ts             # Simple opponent logic
      selectors.ts      # Derived views: playable cards, occupied lanes, etc.
      rules.test.ts     # Unit tests for the rules engine
    components/
      Board.svelte
      Lane.svelte
      Card.svelte
      Hand.svelte
      HeroPanel.svelte
  routes/
    +page.svelte        # Main game screen

Implementation principles

Start with a deliberately small game:

* 3 lanes rather than 5.
* Fixed decks.
* 10–15 cards per side.
* Basic attack/health/cost cards.
* One or two simple effects only.
* A very simple AI opponent.
* No deckbuilding, accounts, animations, or multiplayer at first.

The first milestone is not polish. It is a complete loop: draw cards, play cards into lanes, end turn, resolve combat, and determine a winner.

The most important design rule is to keep the game engine pure and testable. A player action should look something like “play this card into this lane,” and the rules engine should decide whether that action is legal and what the resulting game state should be.

Development order

First, create the SvelteKit project and confirm it runs locally. Then build the game model in plain TypeScript before spending much time on UI. Add unit tests for combat, lane placement, drawing cards, resource spending, and win/loss conditions.

Once the rules engine works, create a simple mobile-first board UI. Cards can initially be plain rectangles with text. Art and animation should wait until the game is already playable.

After the single-player version works, add a simple AI that chooses from legal actions. Only after that should local multiplayer be considered.

Future multiplayer direction

For multiplayer, the preferred later approach is local network play using a small server and WebSockets. One device can host or both devices can connect to a server running on the home network. The multiplayer model should sync player actions and authoritative game state, not UI events.

This will be much easier if the rules engine has already been kept separate from the Svelte UI.