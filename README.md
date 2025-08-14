# Deno inspector panic bug reproduction

Steps to reproduce:

1. Clone this repo:
2. Run `cd packages/plugin-vite`
3. Run `deno run -A --inspect-brk npm:vite build demo`
4. Open inspector in Chrome under `chrome://inspect`
5. Click the continue icon until the `debugger` statement is hit
6. Click forward a few times -> panic
