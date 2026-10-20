# Repository guidance

- This is a vanilla HTML/CSS/JavaScript browser game. No build, lint, or test commands are configured; verify changes by opening `src/index.html` in a browser and playing the game.
- Keep the classic script order in `src/index.html`: `maze.js` → `game.js` → `render.js` → `main.js`. These scripts share globals and are not modules.
- `maze.js` defines the pristine maze and start positions; `game.js` owns game state and rules; `render.js` draws the current state; `main.js` wires input, screens, and the animation loop.
- The spec workflow is optional and lives in `.agents/skills/spec/` and `.agents/skills/spec-impl/`; use it when the task calls for spec-driven development.
