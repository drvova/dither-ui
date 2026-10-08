# src — site + studio app

## Purpose

The dither-ui.com site (landing, docs) and the studio editor, built on the kit
in `../dither-kit`. Feature-Sliced Design (FSD) layering.

## Ownership

- `app/` — entry, global styles/tokens, canonical-path + legacy-hash router (App.vue).
- `pages/` — landing, docs, studio, play (see `pages/AGENTS.md`).
- `widgets/` — studio panels: toolbar, layer-tree, inspector, canvas,
  chart-renderer, widget-renderer, data-editor, agent (the composer / harness
  control plane).
- `features/` — user actions: history (undo/redo), keyboard (shortcuts +
  ShortcutsHelp overlay), persistence (localStorage hydrate/autosave),
  export-code, export-image, export-video (a frame as a HyperFrames
  composition: builder, dialog, delivery for the agent paths), pan-zoom,
  artboard-transform, agent (the Studio agent protocol, seeded evolution,
  the model client + loop).
- `entities/` — domain stores: editor (selection/artboards, single source of
  truth), chart, widget, artboard.
- `shared/` — ui primitives (Segmented, NumberField, ColorField, CodeBlock,
  ContextMenu, ...), config (CHART_TYPES), lib (theme).
- `entities/widget/model/registry.ts` is the single source for Studio's searchable
  component library, inspector controls, untrusted-prop sanitization, functional
  demo composition, and code export. Every public `Dither*` export is covered
  there or by a bespoke widget kind.

## Local Contracts

- Layer imports flow downward only: pages → widgets → features → entities →
  shared. `@dither-kit` may be imported from any layer; nothing imports back
  into it.
- Canonical routes are `/`, `/docs[/section]`, and `/studio`, plus the
  `noindex` player at `/play/` (not prerendered); legacy
  `#/docs[/section]` and `#/studio[/new/<type>]` links remain supported. Route
  entry HTML files own static crawler-visible metadata; docs sections refine
  it at runtime per `/docs/<id>` (see `pages/AGENTS.md`). `app/App.vue`
  resolves both path styles. Internal app links and public asset URLs use
  `routePath()` /
  `assetPath()` from `shared/lib/routes.ts` so the same build works at `/` and
  at the GitHub Pages project base. Add vue-router only when route params
  outgrow this.
- `entities/editor` is the sole mutation path for document state. History
  (`features/history`) snapshots `{artboards, groups}` — excludes viewport and
  selection deliberately; new document-shaped state must be added to both the
  snapshot and `features/persistence`.
- Editor mutations must stay undoable: route them through the editor store so
  the deep watcher records them; never mutate artboards from a component.
- New artboards route through `placeArtboard` after their final size is known; it
  centers every insert exactly in the current viewport. Do not restore cascading,
  origin, or right-edge spawn logic. A generation (several variants of one
  parent) routes through `placeGeneration`: one centred row, the batch
  treated as a single insert.
- The Studio is agent-addressable through `features/agent`:
  - `protocol.ts` is ONE command vocabulary (`runCommand`) behind three doors:
    `window.ditherStudio.run()` (main world), `dither-studio:command` /
    `dither-studio:result` DOM events on `document` with JSON-STRING details
    (any script world — browser-extension agents cannot see page globals;
    strings cross worlds, objects do not), and the `<script
    type="application/json" id="dither-studio-document">` mirror in <head>
    (live document, refreshed on the autosave cadence). Every command is
    untrusted input and lands only through the same validators the inspector
    and file imports use (`applyDocument`, `sanitizeComponentProps`,
    `normalizeArtboard`); nothing evaluates anything. New commands are cases
    in `runCommand` + a row in `registrySchema().commands` + the SKILL table
    + a tool in `llm.ts` when the model should have it.
  - `registrySchema()` is the machine-readable registry (every component's
    prop specs, chart/widget kinds, document shape, commands); the prerender
    reads it off the mounted studio and writes `dist/agent/registry.json`,
    and strips the document mirror from the static bytes. The skill that
    teaches harnesses the document shape and the protocol is
    `public/agent/SKILL.md`; both are indexed from `llms.txt` ("Agents").
  - `evolve.ts`: a GENERATION is `count` seeded clones of one parent, mutated
    inside the allowlists (chart seed/texture/colour, registry props within
    their specs, screens cell by cell) and normalized; same parent + seed →
    same generation. `placeGeneration` (editor store) lays a generation out as
    one row centred on the viewport and selects it — the one multi-frame
    placement, a batch insert whose midpoint is where a lone frame lands.
  - `llm.ts`: the in-page agent loop and the shared vocabulary. Providers
    are bring-your-own-key only — Anthropic Messages (direct browser calls)
    and the OpenAI chat-completions shape with a `baseUrl` (OpenAI,
    OpenRouter, Groq, Gemini compat, local servers). Keys stay in the
    browser (`dither-agent-config` in localStorage only when "remember" is
    on). Subscription logins are NOT collected: Anthropic forbids
    third-party apps holding Claude.ai credentials and OpenAI plan access
    needs partner registration — those users run their own harness through
    the ACP bridge (`acp.ts`) or the protocol. Harness rules the loop
    follows: both providers STREAM (SSE; `delta` events, a JSON reply is the
    fallback) with usage from the final chunk; `post()` retries 408/409/429/
    5xx/529 and network errors twice with 1s/2s backoff and surfaces
    `retry` events, an abort ends it at once; a tool marked `destructive`
    (`remove_artboard`) waits for `approve()` and a refusal is returned to
    the model as `{ ok: false, error: "denied by the user" }`; tool calls run
    through `runCommand`, and `shapeResult` elides data URIs and caps at 12k
    chars with a hint; every turn gets a fresh `Canvas now:` line from
    `canvasContext()` in the system prompt; `estimateTokens` + `compact()`
    (drop old tool results, keep the last two user turns verbatim) keep the
    transcript under `contextBudget` (60k) and emit `compact`; `pull()`
    steering is drained after each turn's tool results (Anthropic: merged
    into the same user turn after the `tool_result` blocks); `turn` events
    carry step, elapsed, usage and context; the loop stops on prose or the
    step budget. `AgentConfig` adds `backend` (`acp` | provider), `bridgeUrl`,
    `remember`, `auto`; `loadSession`/`saveSession` persist a per-project
    transcript (`dither-agent-session-<projectId>`, capped at 160k chars by
    dropping oldest entries and compacting).
  - `acp.ts`: the composer as an Agent Client Protocol client over a
    loopback websocket to `bridge/dither-bridge.mjs` (see `bridge/AGENTS.md`
    for the wire contract). `connectAcp` sends the Studio tools
    (`bridge/tools`), runs `initialize` + `session/new`, maps
    `session/update` notifications into the same `AgentEvent` stream the
    key loop emits (`mapUpdate`: message chunks → `delta`, tool calls →
    `activity` with a status-only update keeping its title, plans → `plan`;
    mirrors of Studio tools are skipped because they render from the
    `studio/call` path), answers `session/request_permission` through the
    panel's approval UI, and executes `studio/call` through `callStudioTool`
    so the harness's MCP tool calls land on the canvas. `prompt()` resolves
    with the stop reason and the turn's text; abort sends `session/cancel`;
    `bridge/exit` fails every pending request so a dead agent never leaves
    the panel busy. Pure parts are pinned by `tests/agent-protocol.spec.ts`,
    `agent-evolve.spec.ts`, `agent-llm.spec.ts`; the bridge chain by
    `tests/bridge.spec.ts`.
- Video: `features/export-video` turns ONE frame into a HyperFrames
  composition (hyperframes.dev — HTML that `npx hyperframes render` turns
  into a deterministic MP4). `compositionHtml` writes the root contract
  (`data-composition-id/width/height/duration/fps`; the frame IS the video
  frame), embeds the frame's document as JSON with `<` escaped, and carries
  the player inline (`{ js, css }`, `</script` escaped in the bundle) or by
  reference (`{ jsRef, cssRef }`). The player is `pages/play`; its
  single-file bundle is a second build, `vite.player.config.ts` →
  `dist/play/player.js` + `player.css`, which `npm run build` runs after the
  site build because the site's entries share chunks; `playerAssets()`
  fetches it from the same origin and on a dev server, where it does not
  exist, the export says so. Delivery: the Studio's video dialog downloads
  the self-contained file; the `video.export` protocol command returns the
  composition referencing `./player.js` + `./player.css` and the assets'
  absolute URLs (sync, for any consumer); the `export_video` tool is
  finished by `finishStudioTool` — the in-page loop downloads, the bridge
  path ships `data.files` for the bridge to write under the harness's
  project as `video/<slug>/index.html`. Options normalize to seconds 1–600
  (default 6), fps 24|30|60, theme dark|light. Pinned by
  `tests/composition.spec.ts`, the `video.export` case in
  `tests/agent-protocol.spec.ts`, and the file case in `tests/bridge.spec.ts`.
- Keyboard map lives in `features/keyboard/useShortcuts.ts`; every new
  shortcut also gets a row in `ShortcutsHelp.vue`.
- Pointer transforms use `features/artboard-transform/startDrag`; it filters by
  pointer id and owns pointer-up/cancel/unmount cleanup. Artboard surfaces drag
  only from non-interactive regions so live controls retain pointer ownership.
- Move, nudge, duplicate, delete, lock, and group commands act on the complete
  selection; locked members remain stationary.
- Toolbar hierarchy is contextual: project/insertion/global view controls persist;
  edit, data, and export actions appear in the selection toolbar only while an
  artboard is selected. Project file import/export stays in the project menu.
- Studio lifecycle watchers are singletons while the route is mounted:
  `startAutosave`/`startHistory` replace prior handles and StudioPage stops them
  on unmount. Route revisits must not accumulate deep watchers.
- A11y floor: icon-only buttons carry `aria-label` (+ `aria-pressed` for
  toggles); dialogs use `role="dialog" aria-modal`, close on Escape, focus on
  open and TRAP Tab — app dialogs wrap their panel in the kit's
  `DitherFocusScope` (ExportDialog with `autofocus=false`, its own close
  button takes focus via an `immediate` watch because it mounts lazily with
  `open` already true; ShortcutsHelp with autofocus), which also restores
  focus on close; menus (toolbar project/library, ContextMenu `role="menu"`
  + `menuitem`) dismiss on Escape and on a pointer outside, focus their
  first item on open, and take ArrowUp/Down/Home/End through
  `shared/lib/menu.ts` (`menuKeydown`, `focusFirstMenuItem`); no
  `window.prompt`/`confirm` — the project menu names inline (Enter commits,
  Escape backs out) and deletes through `DitherAlertDialog`; global `:focus-visible` ring is in `app/styles.css` — do not
  suppress. Interactive targets are at least 24px on their short side
  (`h-6` / `min-h-6` / `size-6` on dense chrome); text on `bg-accent` is
  white and the accent blues are tuned to clear 4.5:1 with it (light
  `#1d63d0`, dark `#1f6fd6`) — do not brighten them back.
- Layer tree is a `listbox`: every row type is a focusable `role="option"`
  with `aria-selected`, Enter/Space select (`.self`-guarded so rename inputs
  don't retrigger), ↑/↓ move focus and MUST stopPropagation — the same keys
  nudge artboards at window level. New row kinds follow this shape.
- Design tokens: shadcn-style CSS vars in `app/styles.css`; components use
  token utilities (bg-background, text-muted-foreground, border-border), never
  raw hex. The same file holds the site chrome voice (`@layer components`:
  `.nav-a`, `.nav-pill`, `.micro`, `.eyebrow`, `.led`) shared by the landing
  and docs headers.
- Entry (`app/main.ts`) is `createApp` — client render, deliberately NOT
  hydration: the route prerender (`scripts/prerender.mjs`) is a crawler
  surface, and hydrating it corrupts DOM because kit components gate on
  measured state (chart `ctx.ready`, mount flags), so first-render vnodes
  never match the settled snapshot. Don't retry hydration without first
  making first render equal settled state.
  Because the client renders fresh over those bytes, one-shot entrance
  latches are runtime-only: a figure marks itself `data-live`/`data-done`,
  and the prerender strips both before serializing, so the static page
  ships the figure un-latched and the client plays the entrance exactly
  once (a snapshot taken after it played flashed the finished art, hid it
  on mount, then replayed — measured on a 4x-throttled CPU).
- Docs sections are DIRECT children of `.docs-flow` and carry
  `content-visibility: auto` + `contain-intrinsic-size: auto 700px` — below-
  fold sections skip layout/paint until they approach the viewport (the page
  is 220 sections / ~180k px; first layout of everything cost seconds). New
  section wrappers must stay inside `.docs-flow` to keep the rule applying.
- Engine gate: `app/main.ts` adds `html.engine-webkit` when the UA is WebKit
  by ENGINE (`AppleWebKit` without `Chrome`/`Android` — so iOS skins like
  CriOS/FxiOS/EdGiOS count), and the docs sections then opt OUT of
  content-visibility there, because WebKit's reveal path keeps stale geometry
  until a forced flush — blank chunks under real scroll (bug 321501) and
  re-entry jank (318216), both unfixed as of Safari/iOS 26. Chrome/Gecko/Edge
  keep the skip. Remove the gate when those bugs ship fixes.
- `shared/ui/AdSlot.vue` never evaluates the EthicalAds client on the
  critical path: the slot loads only when it approaches the viewport AND the
  document is loaded plus a beat (8s-after-load safety net), and the aside it
  lives in is `display: none` under lg — phones never fetch it. The gate is
  IntersectionObserver on purpose: Safari has no `requestIdleCallback`.

## Verification

- `npx vue-tsc --noEmit` and `npx vite build` green before commit.
- Interactive checks in a real browser (agent-browser + screenshots) for
  anything visual or stateful (undo/redo walks, dialog focus, deep links).
- The video path on the built site (`vite preview`): the player seeked by
  synthetic `hf-seek` events gives identical bytes for identical times, the
  dialog's download opened from disk matches the player at the same time,
  and `npx hyperframes lint`/`render` accept the file.
- Perf probes MUST use trailing-slash URLs (`/docs/`, `/studio/`): `vite
  preview` falls back to the landing HTML for slashless paths, which silently
  measures the wrong page.

## Child DOX Index

- `pages/AGENTS.md` — landing, docs, studio, play page contracts
