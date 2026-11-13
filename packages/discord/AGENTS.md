# discord

## Purpose

The Discord interactions service: `/component <section>` answers with a
Components V2 message that shows the section's share card, playing, and
updates in place on its buttons. `README.md` is the operator's manual.
Paths here are from this package's root.

## Ownership

- `src/service.mjs`: the `/interactions` webhook, the previews it serves
  and the card renderer it drives.
- Does not own the cards: they are drawn by the built site's own renderer
  page (`og/index.html`, `window.og.files`), which the service opens in a
  headless browser for a re-rolled or inverted card.

## Local Contracts

- One file, no build step, no import of another package of this workspace
  (`tests/workspace.spec.ts` at the root). `playwright-core` is loaded
  only when a card is drawn.
- Reads a built site from `DIST` (default: this repository's
  `packages/site/.output/public`): the section manifest, the renderer page
  and its assets, served as built. A plain link to the site needs no
  service: its component embed does that.
- Stateless: a button's custom id carries the card
  (`dith:<id>:<seed>:<inv>`).
- Requests are verified with Ed25519. The dashboard key is a raw 32-byte
  point: wrap it in the SPKI prefix and verify with `verify(null, ...)`
  (Node rejects a named digest for Ed25519).
- No bot token at run time: interactions answer inline.

## Work Guidance

## Verification

- `npm run lint` at the root covers the file. The site's
  `packages/site/tests/crawler-files.spec.ts` holds what the service and
  the site's embeds must agree on.
- By hand: `npm run build` at the root, then the service against the
  build (`README.md`), `GET /health`, and a signed `PING`.

## Child DOX Index

- none
