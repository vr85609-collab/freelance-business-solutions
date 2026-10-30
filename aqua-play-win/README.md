# Aqua Arcade

A small, bilingual, installable arcade for Aquaemoticons. Run with Node 20 or newer:

```
npm ci
npm test
npm start
```

Open http://localhost:3000. No external assets or runtime packages are needed by the application server. `linkedom` is used only by the development tests.

## Library

The arcade has 36 games. Pool was removed and replaced with 20 new games:

Mini Sudoku, Minesweeper, Reversi, Five in a Row, Dots & Boxes, Hidden Fleet, Picture Logic, Maze Escape, Crate Keeper, Pipe Connect, Knight’s Trail, Eight Queens, Word Ladder, Letter Shuffle, Hidden Word, Make 24, Gem Swap, Peg Jump, Tower Transfer, and Nim Tactics.

Existing games: Bubble Guess, Tic-Tac Tactics, Memory Match, Pattern Pulse, Light Switch, Merge 2048, Connect Four, Word Recall, Number Sprint, Codebreaker, Slide Puzzle, Higher or Lower, Color Clash, Block Garden, Word Search, and Word Tiles.

The home screen shows 12 compact cards at a time, with Show more, category filters, English/Spanish search, favorites, and the last 12 recently played games. Favorites and recent history use `aqua_library_v1` in localStorage. Clearing browser data resets these preferences. Game progress continues to use `aqua_arcade_v2`, preserving existing stars.

The play screen hides home content and keeps the objective, board, and controls visible. Detailed rules are available in a collapsed disclosure and in the existing help dialog. Light/dark themes, English/Spanish, keyboard controls where applicable, and reduced-motion styling are supported.

## Rules and rewards

The 20 added games each award 20 virtual stars on a win. Help explains the exact rules and objective. CPU games have explicit win/loss/draw states. Undo is available for exploratory puzzles. Make 24 uses a small arithmetic parser without eval. Generated mazes are connected; supplied puzzles have solution tests.

Stars are local entertainment points, not money. Bubble Guess discounts are examples only. Actual Shopify redemption remains disabled pending identity verification, persistent one-use claim records, weekly limits, and server-side integration. Do not use local scores as proof for real rewards. See REWARDS_SETUP.md and rewards-policy.json.

## Offline and updates

The service worker precaches the complete application, including new games, catalog, and stylesheet. It serves a complete installed release to prevent mixing incompatible HTML and scripts. After first loading online, the games run offline; Bubble Guess falls back to local practice. The Update app button appears when an already controlled page receives a new release. Offline wins cannot be redeemed for discounts.

## Validation

`npm test` checks the 36-game registry and lifecycle, the retained games, every new game, puzzle solvability, both word-game languages, arithmetic parsing, CPU round completion, valid/invalid moves, favorites/search/category/pagination/recent navigation, language switching, blocked storage, timer cancellation, duplicate rewards, and offline release consistency.

All changes stay on the `aquaemoticons-play-win` branch. Render automatically deploys this branch using the `aqua-play-win` directory. Other business site files and the main branch are separate.
