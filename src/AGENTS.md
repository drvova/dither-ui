# src — site + studio app

## Purpose

The dither-ui.com site (landing, docs) and the studio editor, built on the kit
in `../dither-kit`. Feature-Sliced Design (FSD) layering.

## Ownership

- `app/` — entry, global styles/tokens, canonical-path + legacy-hash router (App.vue),
  the install surface (`install-files.ts`) and the Studio's service worker
  (`sw.ts`, its rules in `offline.ts`).
- `pages/` — landing, docs, studio, play (see `pages/AGENTS.md`).
- `widgets/` — the site's one `site-header` (the landing's and the docs'
  capsule, a page's tools in its slot, the menu sheet of tone bands under
  lg; see `pages/AGENTS.md`, Header), the docs previews' and the Studio canvas's `workbench` (inspect, measure,
  annotate, capture; see `widgets/workbench/AGENTS.md`) and `source` (the
  preview's files, edited and run in the page; see
  `widgets/source/AGENTS.md`) and the studio
  panels: toolbar (the title bar and the canvas bar), layer-tree,
  inspector, canvas,
  chart-renderer, widget-renderer, reel-renderer (a reel's clips on the kit
  clock; a film's camera, callouts and chapter band), data-editor, agent
  (the composer / harness control plane: `AgentPanel.vue` holds the
  session and lays it out, `ui/` draws the thread's entries and the trays
  over the input, `model/` reads the thread, the reply's prose and the
  tool steps in words).
- `features/` — user actions: history (undo/redo), keyboard (shortcuts +
  ShortcutsHelp overlay), persistence (localStorage hydrate/autosave,
  projects created, switched, renamed, duplicated (`duplicateProject`:
  the work, not the chats, opened beside the original) and deleted (the
  last one's place taken by a new project under a new name; the page
  then forgets its chats, `forgetProject`)),
  export-code, export-image, export-video (a frame as a HyperFrames
  composition: builder, dialog, delivery for the agent path; a film's score
  as its audio track), reel (the reel's and the film's pure timeline, the
  score preview, its audio opened in the click that asks for it, as iOS
  needs), pan-zoom (wheel, middle or Space drag, one finger on empty
  canvas pans, two fingers pinch about their midpoint; a second finger ends
  the first finger's drag with a `pointercancel`, a third starts nothing,
  and the pinch rebases on whichever pair remains; `tests/canvas-touch.spec.ts`;
  it reads `editor.viewport` at each use, never a kept copy, since loading
  a document, switching a project or centring a fresh frame replaces it;
  `tests/pan-zoom.spec.ts`; the zoom keys, the canvas bar and the agent's
  `view` steer it through the editor's view functions, below),
  artboard-transform, agent (the Studio agent protocol, seeded evolution,
  the Studio tools and the ACP client behind the composer, and `handoff.ts`:
  the frames the canvas picks for the agent and the messages asked at the
  selection, which the canvas writes, the agent panel reads and the
  Studio page opens the panel for).
- `entities/` — domain stores: editor (selection/artboards, single source of
  truth; `model/view.ts`, the canvas view: `zoomTo` about the stage's
  centre or a point, `zoomIn`/`zoomOut` by `ZOOM_STEP`, `actualSize`,
  `frame`/`fitAll`/`fitSelection` (never past 100%), and
  `startInspecting`/`stopInspecting` over `editor.inspecting`, during
  which every zoom holds), chart, widget, artboard.
- `shared/fonts/` — the display face: `michroma-latin.woff2` (the Latin
  subset, self-hosted), its license `OFL.txt` (keep them together) and
  `display.css` (its `@font-face`, `font-display: swap`; the mono and
  Michroma set the statement on the same number of lines, so the swap
  shifts nothing).
- `shared/` — ui primitives (Segmented, NumberField, ColorField, CodeBlock,
  ContextMenu, ...; `ToolMark` over `marks.ts` — the real one-colour
  marks of npm, pnpm, Bun, Node, Vue, Svelte, Tailwind, StyleX, CSS
  Modules, CSS, GitHub and the coding agents
  the bridge starts (keyed by its harness ids), from Simple Icons (CC0),
  LobeHub (MIT) and the tools' own site icons, paths verbatim; their
  owners' trademarks, shown only beside the tool's name, never restyled,
  dithered or put in the kit; imported by path, never through the
  `shared/ui` barrel, which would pull every shared component into the
  landing's first load; `Segmented` takes `labels` where an option's
  value is not how a reader writes it), config (CHART_TYPES; `titles.ts`, the routes' titles, a leaf
  the landing can load without the docs IA), lib (theme,
  routes (with `safeUrl`, the ONE test of a URL a document may carry into
  an href or a src: http(s), mailto, a raster `data:` image or a relative
  path, read as the browser reads it), base64, menu,
  `storage.ts` — the ONE path to localStorage (`storage.get/set/remove`,
  `readJson` → `unknown` for the caller to parse, `writeJson`), never
  throwing where storage is blocked or full —
  `sfc.ts` — the ONE way the code generators put a document value into an
  SFC (`attr` for a static attribute, `js` for a literal in script or a
  single-quoted binding, `key`, `objectLiteral`, `text` for template text),
  so exported code carries values as data, never as code —
  `sound.ts` — Kobra's interface sounds as WebAudio voices behind one
  remembered switch (`sounds`, localStorage `dither-sounds`; a context
  WebKit left suspended or interrupted resumes on the next cue) —
  `long-press.ts` — `installLongPress`, the Studio's polyfill for the
  contextmenu iOS never fires: a touch held still 500ms dispatches one at
  the finger, and when a menu took it (its handler prevented the default)
  swallows the click its release makes (a cancelled touch makes none, and
  a press on nothing keeps its click); a moving finger, a mouse, a text
  field and the platform's own menu (Android) are left alone
  (`tests/long-press.spec.ts`) — `files.ts` —
  `download()` and a stored .zip of text files, the ONE download path for
  the Studio's exports, the workbench and the source panel —
  `words.ts` — `breakable`, a camelCase name with a break point at each
  hump, for display only (the inspector's names) —
  `restyle.ts` — a snippet in the reader's styling system — and the
  node-side `utility-map.ts` that compiles its vocabulary and
  `stylex-layer.ts` that writes the kit's StyleX layer from its Tailwind
  layer (see `dither-kit/AGENTS.md`); `gif.ts` — the
  ONE GIF encoder (one palette, `keep` colours held exact, optional
  ordered dither, delta frames), import-free because the share-card
  renderer carries its source inline: the workbench's captures and the
  share cards both go through it); `inspect/` — what the live DOM reads
  as (`color.ts`: parse, print, WCAG contrast; `geometry.ts`: boxes and
  segments; `measure.ts`: boxes, box model, type, role/name/states, Tab
  order and the accessibility audit, boxes at a `scale` for a zoomed
  canvas), read by the workbench and by the agent's `inspect`, imported
  by path).
- Untrusted input is parsed ONCE where it enters, into a type nothing past
  it re-checks: documents through `parseDocument` / `normalizeArtboard`
  (each field of several shapes, a glow, a texture, an easing, parsed whole
  so every shape the editors write survives; a `url` prop, an image's or an
  avatar's address through `safeUrl`), stored values through `storage.ts`
  and a parser at the reader, bridge messages through a parser in `acp.ts`
  (`permissionOptions`). Pinned by `tests/security.spec.ts` and
  `tests/codegen-escape.spec.ts` (hostile labels, keys, props and slot text
  through both code generators and Vue's own compiler).
- `entities/widget/model/registry.ts` is the single source for Studio's searchable
  component library, inspector controls, untrusted-prop sanitization, functional
  demo composition, and code export. A text field that reads a `DitherField`'s
  context (DitherInput, Textarea, Select and the Email, Password, Search,
  Phone and Currency inputs, which wrap DitherInput) is `labelled`: a `label`
  text setting (empty by default) that is not the component's prop but the
  visible label of the `DitherField` the canvas (`widget-renderer/FieldWrap`)
  and the code export put it in, so the label is tied to the control;
  `boundProps` is the ONE way a registry component's props are bound
  (mapped, the label left out), `fieldLabel` the label or null.
  `tests/field-label.spec.ts`. A component with a v-model (a field's
  value, the chips' pick) keeps it as `model`, which `sanitizeModel` takes
  from untrusted input (a file, `component.add`'s or a screen cell's
  `value`, `artboard.update`'s `widget.value`) only in the kind of the
  entry's default and under `MODEL_MAX`, else the default;
  `tests/field-values.spec.ts`. Every public `Dither*` export is covered
  there or by a bespoke widget kind.

## Local Contracts

- Layer imports flow downward only: pages → widgets → features → entities →
  shared. `@dither-kit` may be imported from any layer; nothing imports back
  into it.
- Canonical routes are `/`, `/docs[/section]`, and `/studio`, plus the
  `noindex` player at `/play/` (not prerendered); legacy
  `#/docs[/section]` and `#/studio[/new/<type>]` links remain supported. Route
  entry HTML files own static crawler-visible metadata (their titles are
  `shared/config/titles.ts` `ROUTE_TITLES`, which App.vue sets as the route
  changes; `tests/titles.spec.ts` holds each page's three copies to it); docs sections refine
  it at runtime per `/docs/<id>` (see `pages/AGENTS.md`). `app/App.vue`
  resolves both path styles. Internal app links and public asset URLs use
  `routePath()` /
  `assetPath()` from `shared/lib/routes.ts` so the same build works at `/` and
  at the GitHub Pages project base. Add vue-router only when route params
  outgrow this.
- `entities/editor` is the sole mutation path for document state. History
  (`features/history`) snapshots `{artboards, groups}` — excludes viewport and
  selection deliberately; new document-shaped state must be added to both the
  snapshot and `features/persistence`. `checkpoint()` hands out that
  snapshot and `restoreCheckpoint()` returns to one as a single undoable
  step (the agent's per-message checkpoints); `restoreFrame(snapshot, id)`
  returns ONE frame to how a snapshot had it (put back, taken away or
  re-added), the rest left as they are, as one step (the changes bar's
  per-frame Undo).
- Editor mutations must stay undoable: route them through the editor store so
  the deep watcher records them; never mutate artboards from a component.
- New artboards route through `placeArtboard` after their final size is
  known; it centres every insert in the current viewport, and when a shown
  frame stands there (kept `FRAME_GAP`, 40px, apart) moves it to the
  nearest free canvas (`model/free.ts`, `freeSpot`: 20px steps out to
  2400px, nearest first) and pans the view to it when it is not wholly in
  view (the user's call after the agent's screen landed on a chart). Do not
  restore cascading, origin, or right-edge spawn logic. A generation
  (several variants of one parent) routes through `placeGeneration`: one
  centred row moved as one onto free canvas, the batch treated as a single
  insert. Duplicate and paste place their copies (`cloneArtboard` keeps
  the source's spot) beside the originals, moved as one onto free canvas,
  selected. `tests/editor-placement.spec.ts`.
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
    `normalizeArtboard`); nothing evaluates anything. A command answers
    "ok" only for what it did: `artboard.update` refuses a patch key it
    does not know (`PATCH_KEYS`; a screen's rows sent beside `widget`, as
    an agent did in a live run) before changing anything, saying where it
    goes. New commands are cases
    in `runCommand` + a row in `registrySchema().commands` + the SKILL table
    + an action in `tools.ts` (`STUDIO_TOOLS`, whose commands
    `tests/agent-tools.spec.ts` holds to the registry's list) with its
    row in the composer's `STEPS` (`widgets/agent/model/steps.ts`).
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
  - `tools.ts`: the Studio's actions — `STUDIO_TOOLS` (one action
    per protocol command, run through the one `dither` tool, with JSON-schema parameters and arguments it
    always sends, `preset`: `get_registry` asks `registry.get` for the
    brief registry, names, labels and groups, which a harness reads in one
    answer where the full prop specs run past 100 kB, and `is` for one
    component in full; `STUDIO_SERVER`, the MCP server's name the bridge
    carries a copy of, pinned by `tests/agent-tools.spec.ts`; `callStudioTool` runs
    one through `runCommand`, `finishStudioTool` turns `export_video`
    and `export_png` (the frame drawn by `artboardPng`, base64) into
    `data.files` for the bridge to write). The canvas bar's every key is
    an action here too: `duplicate` (`artboard.duplicate`), `group`,
    `ungroup` (a group's id or a frame of it), `replay`, `set_view`
    (`view`: fit every frame, the selection or one, step, 100%, a zoom),
    `inspect` (`inspect.ts`: the frame's controls in Tab order and the
    audit's findings, read off its drawn surface (`surfaceOf`,
    `features/export-image`) at the canvas's zoom), `export_png`
    (`image.export` names `image/<slug>.png`); frame summaries carry
    their `group`; the `AgentEvent` union the
    composer renders (delta, thought, assistant, tool, activity with the
    harness's ACP tool kind, plan, mode, commands, turn, error, stopped,
    done; a stop is its own event, never an error), `AgentActivity`
    (what the toolbar shows of the agent), and the composer's state: `AgentConfig`
    (`bridgeUrl`, the chosen `harness` id or `custom` + `command`, `auto`
    permission answers, `follow` — nothing secret, always saved) and
    drafts per chat, text and attachments (`dither-agent-draft-<projectId>/<chatId>`,
    `loadDraft`/`saveDraft`; a project's older draft is taken once into
    its first chat; pictures are dropped past `DRAFT_MAX` so the text is
    always kept; the panel parses what comes back with `attachmentsOf`). There is NO model client
    in the app: the composer never runs a model and never holds a key.
  - `dither.ts`: the Studio as ONE MCP tool for a harness. `ditherDef()`
    is its one definition (every action's name, no schemas: a third of
    the old list's size, guarded by its spec); `parseDither` reads its
    input once into `find | run | build`; `findFor(job)` ranks the actions
    (the `STUDIO_TOOLS` of `tools.ts` and the tools harnesses built) by the
    share of the job's words they answer, counting only words some action
    speaks of, a person's words mapped to the schema's (`wordsOf`), and
    returns the best three with their exact arguments, the kit components
    the job names, the best fit, and a nudge to build under `GOOD_FIT`;
    `callDither` runs an action (a failure answers with what it takes),
    keeps a built tool (`built`, `dither-agent-built`, newest first;
    `removeBuilt`), and runs one only after `approve`, through `sandbox`,
    its own Studio calls reaching the actions only; every action that ran
    is reported as a step (`onStep`). Guarded by `tests/agent-dither.spec.ts`.
  - `sandbox.ts`: where a built tool runs. `runSandboxed(code, args,
    call)` puts `sandboxDocument()` in an iframe with `sandbox="allow-scripts"`
    and no allow-same-origin (no page, cookies or storage), a CSP of
    `default-src 'none'` (no request of any kind), and a blob worker
    (`workerSource`: `studio.run` over messages, then the code as the body
    of an async function of `(args, studio)`) behind one `MessageChannel`;
    past `SANDBOX_MS` or `SANDBOX_CALLS` the frame goes, the worker with it.
    Proven in Chromium by `tests/sandbox.spec.ts` (answers through
    `studio.run` only; fetch, script imports and sockets refused with no
    request reaching a local server; no document, parent or storage; an
    endless loop stopped while the page answers; parse and throw errors
    reported).
  - `chats.ts` (imported by path, so the page never pulls the protocol):
    a project's chats, the reactive `chats` store shared by the Studio's
    sidebar, its search and the agent panel (`project`, `list` newest
    first as `{id, title, at, named?, pinned?}`, parsed once where the
    index is read, the `active` chat). `openProject` (a no-op when open;
    the thread a project kept before chats existed becomes its first
    chat), `newChat` (listed once something is said), `openChat`,
    `removeChat`, `renameChat` (a name kept over the first message's; an
    empty one gives that back), `pinChat`, `chatGroups` (Pinned, Today,
    Yesterday, This week, Earlier, empty ones dropped), `stepChat` (the
    chat before or after in that order), `chatsOf` (another project's,
    for search), `forgetProject` (a deleted project's index, threads and
    drafts); `saveThread`/`loadThread` keep each chat's thread
    (`dither-agent-session-<projectId>/<chatId>`, entries + usage, capped
    at 160k chars by dropping the oldest entries) and its place in the
    index (`dither-agent-chats-<projectId>`; moved to the top when
    something new is said); `titleOf` (its first message's first line) and
    `agoOf` (now, 5m, 2h, 3d, 2w, then the day). Guarded by
    `tests/agent-chats.spec.ts`.
  - `acp.ts`: the composer as an Agent Client Protocol client over a
    loopback websocket to `bridge/dither-bridge.mjs` (see `bridge/AGENTS.md`
    for the wire contract). Nothing at the address rejects with
    `NoBridge`, which the panel answers with its setup card, never a raw
    error; `bridgeCommand(page, file, bridgeUrl)` is that card's line
    (the file the site serves at `BRIDGE_FILE`, from `bridge-file.ts`,
    which imports nothing so `rstack.config.ts` reads it too; `--origin`
    only when `bridgeKnows` says the bridge would refuse the page, pinned
    against the real bridge by `tests/bridge.spec.ts`). `connectAcp`
    sends the Studio tools
    (`bridge/tools`), resolves on the bridge's `bridge/hello` (cwd, the
    known harnesses with their PATH status, the running agent or null) and
    boots a harness that is already running (`initialize` + `session/new`,
    reading modes and the model off the answer; its name from
    `agentInfo.title`, then `name`); `client.start(id | { command })` asks the
    bridge to spawn one and boots it; `stop()`, `newSession()`,
    `setMode()`, `setModel()` (`session/set_config_option` on the
    harness's own model option: `modelOf` reads the session's
    `configOptions` select of category "model", groups flattened, and
    `modelName` says which model a "default" entry is), `setOption()` (the
    same call on any other setting: `settingsOf` keeps the selects that
    are neither model nor mode and offer a choice, effort or thinking,
    each named as the harness names it); `acceptsImages` (the harness's
    `promptCapabilities.image`, `takesImages`) decides whether `prompt()`
    sends pictures (`promptBlocks`: the text, then image blocks only to a
    harness that takes them). `mapUpdate` turns `session/update` into events (message
    chunks → `delta`, thought chunks → `thought`, tool calls → `activity` with a status-only update
    keeping its title (an untitled call waits for the update that names
    it, never its id), plans, `current_mode_update` → `mode`,
    `config_option_update` → `model` and `settings`, `usage_update` (tokens used of the
    window, a cost) → `context`,
    `available_commands_update` → `commands`; the harness's mirror of its
    call of the one tool (its title the tool's name or names the
    `STUDIO_SERVER`) is skipped because it renders from the `studio/call`
    path), permission requests go through the panel's inline approval,
    `bridge/tools` advertises only `ditherDef()`, and `studio/call` runs
    `callDither` (the panel's `approveTool` asks before a built tool runs;
    without it none runs) so each action lands on the canvas as a step, `prompt()` resolves with the stop reason and the
    turn's text (one assistant entry per prose segment between tool
    calls and thoughts), abort sends `session/cancel`, `bridge/exit` fails every pending
    request. Pinned by `tests/agent-protocol.spec.ts`,
    `agent-evolve.spec.ts`, `agent-tools.spec.ts`; the bridge chain by
    `tests/bridge.spec.ts`.
- Styling systems: `shared/lib/restyle.ts` is the ONE translator.
  `restyle(code, system, framework)` rewrites the `class` / `:class` /
  `style` attributes of a Vue snippet (or a Svelte one, `class={…}`) into
  named styles for `css` (a `<style scoped>` block; `<style>` under Svelte),
  `modules` (`$style` bindings + `<style module>`; CSS under Svelte) or
  `stylex` (`stylex.create` in the script after its imports, `stylex.attrs`
  on the element — `v-bind` in Vue, a spread in Svelte); `tailwind` returns
  the code untouched. Its data is `virtual-dither-utilities`:
  `utility-map.ts` (node-side only — rstack.config.ts, tests; an Rspack
  virtual module, recompiled in watch mode when a scanned file changes)
  scans `UTILITY_SOURCES` (`pages/docs`, `entities`) with Tailwind's scanner
  and compiles every candidate with Tailwind's compiler (theme inlined; the
  kit's `@theme inline` tokens and dark variant read from
  `dither-kit/tailwind/kit.css`), keeping per class its cascade index, its variant
  chains and declarations, plus the `@property` initials.
  `compileUtilities(tokens, strict, map)` merges a class list in
  Tailwind's order (so `px-2 p-4` cascades as Tailwind does), resolves
  every `--tw-*` input to the end (a ring with an offset nests a dozen),
  folds Tailwind's `@supports (color: color-mix(...))` guard into its rule
  (every supported browser passes it), simplifies `calc()`s and drops
  no-op shadows; `map` defaults to the docs' vocabulary, and the kit
  layer generator passes the kit's (`buildUtilityMap(root,
  ["dither-kit/tailwind"])`). StyleX comes out as its compiler takes it:
  a pseudo-element is a top-level key holding its own properties
  (`"::placeholder": { color }`), vendor properties are spelled
  `WebkitLineClamp`. Unknown classes stay classes (the kit
  stylesheet covers them); for StyleX so does any class whose rule needs a
  selector it cannot express, a custom property or `!important`, and a
  dynamic binding only becomes `attrs()` arguments when its shape allows
  (literal / ternary / `&&` / array / object; a ternary or `&&` takes any
  condition, an empty branch is `null`, an array converts whole or not at
  all). In every target only the literals in class position are named (a
  ternary's arms, the right of `&&`, array items, object keys), so a
  condition's string (`view === 'grid'`) stays a value. Names come from the element
  (`stack`, `row`, `grid`, `layer`, `frame`, `box`, `text`, a component's
  name without `Dither`, a literal's first utility), one per distinct rule
  set, inline `style` folded into the element's rule. The preference
  (`styling` ref, localStorage `dither-styling`) is shared by the docs and
  the Studio. `code.get { id, styling? }` and the `get_code` tool return the
  SFC restyled (`tailwind` default, junk fails); the export dialog's
  `styling` control does the same for the copy and the download. New
  vocabulary is picked up by the next build (dev: on a hot update of a
  scanned file). The docs' Run plays the restyled example in any system,
  StyleX through `widgets/source/model/stylex.ts`. Pinned by
  `tests/restyle.spec.ts`, `tests/stylex-coverage.spec.ts` (every Studio
  export and every docs snippet written as StyleX leaves no Tailwind class;
  only a snippet's own CSS hooks stay classes) and the `code.get` case in
  `tests/agent-protocol.spec.ts`.
- Clock for drivers: `clock.seek { seconds? }` / `clock.release` hold or
  free the kit clock from the protocol (the `seek_clock` tool), and
  `window.ditherStudio.clock` exposes the same four calls (`seek(seconds)`,
  `release()`, `directed()`, `time()`), so a screenshot from any driver —
  CDP, WebDriver, Playwright, a DOM event from an extension world — lands on
  a held moment in any engine.
- Video: `features/export-video` turns ONE frame into a HyperFrames
  composition (hyperframes.dev — HTML that `npx hyperframes render` turns
  into a deterministic MP4). `compositionHtml` writes the root contract
  (`data-composition-id/width/height/duration/fps`; the frame IS the video
  frame), embeds the frame's document as JSON with `<` escaped, and carries
  the player inline (`{ js, css }`, `</script` escaped in the bundle) or by
  reference (`{ jsRef, cssRef }`). The player is `pages/play`; its
  single-file bundle is the `player` environment of `rstack.config.ts` →
  `dist/play/player.js` + `player.css` (one classic script, no async
  chunks, every asset a data URI), built by the same `rs build` as the site
  because the site's entries share chunks; `playerAssets()`
  fetches it from the same origin and on a dev server, where it does not
  exist, the export says so. Delivery: the Studio's video dialog downloads
  the self-contained file; the `video.export` protocol command returns the
  composition referencing `./player.js` + `./player.css` and the assets'
  absolute URLs (sync, for any consumer); the `export_video` tool is
  finished by `finishStudioTool`, which ships `data.files` for the bridge
  to write under the harness's project as `video/<slug>/index.html`.
  Options normalize to seconds 1–600
  (default 6; a reel's default is its length), fps 24|30|60, theme
  dark|light. Pinned by
  `tests/composition.spec.ts`, the `video.export` case in
  `tests/agent-protocol.spec.ts`, and the file case in `tests/bridge.spec.ts`.
- Reel: a frame that plays other frames in order. `ReelModel`
  (`entities/widget`: `{ kind: "reel", clips: [{ id, seconds, transition: {
  kind: cut|dissolve|wipe-right|wipe-left|wipe-down|wipe-up, seconds, cell,
  seed } }] }`) references other artboards by id, so history, persistence
  and `normalizeArtboard` (string ids other than the reel's own, seconds
  0.1–600, transition seconds ≤ the clip's, cell 1–16, kind one of
  `REEL_TRANSITIONS`, junk replaced) cover it; `createClip`/`createReel`
  seed 3s clips coming in over a 0.6s dissolve; `addReelArtboard(ids)`
  (editor) cuts frames in order (reels and unknown ids dropped) into a frame
  sized like its first clip; `removeArtboard`/`removeSelected` prune
  dangling clips; `evolve` leaves a reel alone. `features/reel` is the pure
  timeline on the kit's `planSequence`: `reelAt(clips, t)` → the clip on
  screen, the outgoing clip while its transition runs (none under the first,
  which comes in over the frame's background), the eased progress;
  `reelDuration`, `reelLoop`, `wipeDirectionOf`. `widgets/reel-renderer`
  plays it: one `DitherReveal` layer per clip on screen, keyed by its slot
  so a clip's surfaces survive going from incoming to outgoing, masked by
  the transition's progress; time is the kit clock (free-running it loops
  and `replayToken` restarts it; directed it is the composition's moment,
  held past the end); reduced motion cuts; `data-reel-clip/time/total` and
  `data-reel-layer` are the walk's probes. Clips resolve from the
  `REEL_POOL` injection (the player provides its document's frames) or the
  editor's artboards; `ReelClip` renders a clip through `WidgetRenderer` /
  `ChartRenderer` at its own size, scaled down (never up) to fit — the
  import cycle `WidgetRenderer` → `ReelRenderer` → `ReelClip` →
  `WidgetRenderer` is render-time only. Export: `compositionHtml(…, extra)`
  embeds the reel's clips (`reelClips(a)`) in the composition's document and
  `defaultSeconds(a)` makes a reel's video as long as its cut (the dialog,
  `video.export` and `export_video` default to it). Protocol: `reel.add {
  name?, clips: [id | { id, seconds?, transition? }], frame? }` (unknown ids
  and reels fail loudly, other junk is sanitized), `artboard.update {
  widget: { clips } }` rebuilds the cut, the `add_reel` tool; `code.get`
  answers a comment — a reel has no SFC, it is a video. UI: the toolbar's
  `reel` action cuts the selection in selection order (hidden when only
  reels are selected); the inspector's `ReelPanel` edits length, transition
  kind/seconds/cell per clip, reorders, removes, adds from a picker. Pinned
  by `tests/reel.spec.ts` (timeline, model, protocol, the renderer on a
  seeked clock).
- Film: a reel with a camera, callouts, chapters and a score. Each clip
  carries `camera: [{ t, x, y, zoom, tilt }]` (t 0-1 of the clip; the frame
  point looked at, 0-1; zoom 1 = the frame fitted, 0.25-8; tilt ±30
  degrees; at most 16, sorted), `callouts: [{ x, y, label, note, side, from,
  to }]` (a frame point, a 48/64-character label and note, left|right, up
  inside the clip; at most 8, none without a label) and `chapter: { line,
  spec: [[figure, words]] } | null` (80 characters; up to 4 rows of 12/32;
  a blank line is none); the reel carries `score: { seed } | null`.
  `createClip`/`createReel` start them empty and `normalizeArtboard` fills
  and sanitizes them (control characters out), so reels from before films
  load as still reels. `features/reel` adds the film's pure timeline:
  `cameraAt(keys, t)` (eased like the transitions, the first key held
  before and the last after), `cameraTransform(cam, w, h, lens)` (the CSS
  transform about the stage's centre: `perspective() rotateY() translate()
  scale()`), `cameraPoint(…)` (the same arithmetic for one frame point, so
  a callout tracks it exactly; no DOM measuring, which could not be
  frame-exact under the renderer), `CAMERA_MOVES` + `cameraMoveOf` (the
  inspector's still / push in / pull out / pan right / pan left / drift),
  `calloutsAt(clip, local)` (drawn over 0.9s from `from`, faded over 0.3s
  to `to`), `chapterAt(clips, moment)` (the last chapter at or before the
  clip on screen, the one before it while it comes in over 0.5s),
  `hasChapters`, `scorePlanOf(reel, seconds)` (clip starts, chapter turns,
  callout landings, the seed) and `playScore` (the Studio's preview: the
  kit's samples through Web Audio, once). `ReelRenderer` (opaque, the page
  background) runs each clip layer through its camera, draws the callouts
  over a stage that is a size container (an SVG leader drawn by its dash,
  a ring with an ember core, the label and note in `cqh`), and puts
  `ReelBand` (22% of the frame, a size container: the line and the
  figure-first spec list, a new chapter dissolving in through
  `DitherReveal`) under the stage once any clip sets a chapter; reduced
  motion holds the first key, draws callouts at once and turns chapters
  without the dissolve; `data-reel-camera`, `data-reel-callout` and
  `data-reel-chapter` are the walk's probes. The inspector's `ReelPanel`
  sets a clip's camera move, chapter line and three spec rows, and its
  callouts; the reel's score (on, seed) and "Play with score" (the reel
  replayed with the preview). Protocol: `reel.add` takes `camera`,
  `callouts`, `chapter` per clip and `score` (`true` | `{ seed }`), passed
  raw to `normalizeArtboard`; `artboard.update { widget: { clips?, score? } }`
  patches either; `add_reel` describes them. Export: `scoreWav(a, seconds)`
  synthesizes the cut at the video's length (`scoreCut` + `wavBytes`); the
  self-contained composition (the dialog, the bridge's file) inlines it as
  a data URI and `video.export` references `./score.wav` and returns
  `score: { path, base64 }`; either way `compositionHtml` adds `<audio
  id="dither-score" data-start="0" data-duration data-track-index="1">`,
  which HyperFrames mixes into the MP4. `features/agent/film.ts`
  (`addLaunchFilm`, the Studio's `#new/film`) builds the film's own demo
  through `runCommand`: an area chart, a galaxy, a 640x360 dashboard
  screen, a bar chart and an ASCII "dither-ui", cut into a 21s 960x540 film
  (chapters, camera moves, three callouts, score seed 7), its frames in a
  row under it. Pinned by `tests/reel.spec.ts` (the "film", "launch film"
  and renderer cases) and `tests/score.spec.ts`.
- Keyboard map lives in `features/keyboard/useShortcuts.ts` (the canvas's
  keys in `useShortcuts`, the page's own in `usePanelShortcuts`, read
  through one table, `pageKeyOf`: ⌘K search, ⌘I the chat, ⌘B the
  sidebar from anywhere, ⌘⇧↑ / ⌘⇧↓ the chat before or after outside a
  field; the canvas's arrows nudge only without ⌘); every new shortcut
  also gets a row in `ShortcutsHelp.vue`.
- Pointer transforms use `features/artboard-transform/startDrag`; it filters by
  pointer id and owns pointer-up/cancel/unmount cleanup. Artboard surfaces drag
  only from non-interactive regions so live controls retain pointer ownership.
- Move, nudge, duplicate, delete, lock, and group commands act on the complete
  selection; locked members remain stationary.
- Toolbar hierarchy: project, insertion and panels in the title bar; the
  view, the selection's edit, data and export actions and Inspect in the
  canvas bar (`widgets/toolbar/CanvasBar.vue`, over the canvas's foot,
  always there, its keys disabled rather than removed). Project file
  import/export stays in the project menu.
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
  (`h-6` / `min-h-6` / `size-6` on dense chrome). Pressed and selected
  chrome is `.ring-on` and every toggle carries `aria-pressed` (state is
  never colour alone); the accent blue is the CANVAS's selection colour
  only (artboard ring, handles, snap guides, marquee, screen-cell rings);
  a frame handed to the agent wears a dashed ring in the signal ink instead.
  The accent blues stay tuned to clear 4.5:1 against white (light
  `#1d63d0`, dark `#1f6fd6`) — do not brighten them back.
- Touch and iOS: the app's stylesheet sets every field to 16px at least on
  iOS WebKit only (`@supports (-webkit-touch-callout: none)`, unlayered so
  it outranks the utilities; the source editor grows its gutter with it),
  so focusing one never zooms the page; full-height layouts use `dvh`
  (the Studio, the docs rails, dialogs and menus capped in height), never
  `vh`, which hides their foot under Safari's toolbar. The Studio's canvas
  is `touch-none` and the Studio installs the long press for its menus;
  keys shown on hover show on a screen without hover
  (`[@media(hover:none)]`).
- The inspector's names (and the shared fields' it uses: NumberField,
  Segmented, Toggle, BloomField, TextureField) stand in ONE column,
  `.prop-name` (`--prop-name`, 5.5rem, `app/styles.css`, unlayered), so
  every control in the panel starts on one line; a long camelCase name
  breaks at its humps (`breakable`), never under its control. Paired
  fields sit on `.prop-pairs` (the first of a pair on the name column, the
  second a name its own width, by subgrid); a field with a unit takes its
  own row (a pair's half is too narrow for one); a row indented under a
  name indents by `--prop-name` and the gap. No name keeps a width of its
  own: `tests/inspector-names.spec.ts`.
- Layer tree is a `listbox`: every row type is a focusable `role="option"`
  with `aria-selected`, Enter/Space select (`.self`-guarded so rename inputs
  don't retrigger), ↑/↓ move focus and MUST stopPropagation — the same keys
  nudge artboards at window level. A row's lock and hide keys show on hover,
  while the row holds focus (a key Tabbed to is never invisible) and
  always on a screen without hover; its menu opens on a right click or a
  long press, the rows taking no text selection (the rename field does); a
  hidden row says so with its eye-off key and an italic name, its text
  kept at AA, never dimmed. New row kinds follow this shape.
- Design tokens: shadcn-style CSS vars in `app/styles.css`; components use
  token utilities (bg-background, text-muted-foreground, border-border), never
  raw hex. The same file holds the site chrome voice (`@layer components`:
  `.nav-a` and `.micro` in sentence case, `.nav-pill` (a machined
  secondary key: 10px radius, the hairline, a narrow reflection on its
  top edge), `.led`, and `.ring-on` — the ONE pressed/selected state: ink
  text, a hairline ring in the control edge, a breath of fill, never a
  colour fill; an outline in forced colors), the theme's two control
  inks (`--edge`, the control edge: titanium dimmed to 3:1 on every ground
  it meets, pressed fills included, WCAG 1.4.11; a site field's boundary
  is `border-edge` (a scoped field: `var(--color-edge)`), turning
  `border-ring` on focus, while `--border` stays the hairline of
  containers and dividers; `--destructive`, `text-destructive`, the ink
  of delete, remove and a failed read, 4.5:1 on the theme's grounds; a
  scoped rule that colours a key outranks the utility, so a key wearing
  both carries its own `.key.text-destructive` rule, which
  `tests/destructive-ink.spec.ts` checks across `src/`), and
  the look's MATERIALS, after the user's Y2K
  design system V5 (root `AGENTS.md`), per theme on `:root` (light) and
  `.dark`: `--chrome` (chrome type: gunmetal on light, its lightest stop
  4.5:1 on white; bright on dark), `--chrome-key` (satin aluminum, both
  themes: chrome `#D4DCE1` with a narrow reflection, no hard band),
  `--chrome-rim`, `--shell-ground` (anodized graphite on dark, bone
  ceramic on light, lit from the top left), `--well`, `--gloss`,
  `--recess` and `--recess-sm` (a surface pressed in, shadowed from the
  top left), `--smoke` (smoked polymer: graphite on dark, bone on light),
  a light `--muted-foreground` a step deeper than the kit's (`#5b6270`,
  AA on the bone grounds, not only on white; the faintest text ink: no
  ink fades below it, so never `color-mix` it toward transparent),
  `--float-shadow`, `--ease-settle` (Apple's smooth spring: the kit's
  `springLinear()` as CSS `linear()` under `@supports`, its closest bezier
  `SPRING_BEZIER` before it; also Tailwind's default transition curve, so
  every `transition-*` utility springs; `tests/motion.spec.ts` holds both
  sites' copies to the kit and finds no other curve or linear wipe in the
  site's motion), `--cut` (16px), `--display-face`
  (Michroma, then the mono; the `font-display` utility reads it; its
  `@font-face` is `shared/fonts/display.css`, imported by the landing and
  the docs only, never by the player, whose bundle inlines every asset).
  Classes:
  `.chrome-type` (the ramp clipped to the glyphs, one horizon per line),
  `.spec` (spec label: uppercase, tracked, 10px) and `.speed-tag` (a
  slanted plate), the ONLY uppercase in the site's own chrome;
  `.hardshell` (two corners cut by `clip-path`, which clips what it
  holds, fixed descendants included; a chrome-glint ring along the cut;
  the shell ground; set `--cut` locally for a smaller cut); `.gel` (an
  asymmetric pebble recessed into its shell, `overflow: hidden`, a
  directional highlight over its top 38%; chips in it take z-index 4);
  `.capsule` (a floating smoked-polymer shell: `--smoke` under a light
  8px blur, a narrow reflection, the float shadow; never frosted glass);
  `.rim` (the chrome rim on any positioned element; `.gel` and `.capsule`
  carry it); `.key-chrome` (the primary key: a satin aluminum capsule
  with obsidian ink, lifting 1px on hover except under reduced motion;
  the ONLY capsule key, every other key is machined); `.track` (machined
  segments recessed into the surface: 2px padding, 10px radius, its keys
  7px; the picked one `.ring-on`). Chrome type goes on display type only
  (the landing's statement, section titles and figures, the docs' page
  title), never on body text or every heading. Reduced transparency
  drops the shell ground and the highlight and makes the capsule solid;
  forced colors drop the cuts, rims and chrome type for system colours
  and plain borders (tracks bordered, the pressed segment outlined).
  `tests/theme-contrast.spec.ts` reads both themes' tokens from the
  stylesheets and holds the foreground, muted and destructive inks at
  4.5:1 and the edge and ring at 3:1 on the page, card, smoke, every
  shell stop and the pressed fills, chrome type's stops at 4.5:1 on the
  page, and the pressed ring to the edge.
  Shared by the docs and the Studio; none of them grows a voice of its
  own. The landing takes only `.nav-a`, `.chrome-type`, `.key-chrome` and
  the dark theme's tokens from it (always dark), printed on its own
  obsidian (root
  `AGENTS.md`, `pages/landing/chapters.css`): its keys, picked segments,
  cards and panels are fills on one raised ground, never rings or tags;
  its only hairlines are the frame's.
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
- Docs sections are DIRECT children of `.docs-flow`: the page shows one
  at a time by toggling `hidden` on them (`pages/AGENTS.md`, Wayfinding),
  and the prerender lifts each into its own static page by the same rule.
  A section a pack renders is mounted only once opened (`docs/packs.ts`):
  the prerender asks for all of them (`/docs?all-sections`,
  `ALL_SECTIONS_PARAM`) and reads each family's name off its rail heading's
  `data-group`; a new pack is a row in `PACKS` and a `v-if="mounted(...)"`.
  New section wrappers must stay direct children of `.docs-flow`.
- Page transitions: the routes (`/`, `/docs`, `/studio` and the section
  pages) opt into cross-document view transitions in `app/styles.css`
  (`@view-transition`, none under reduced motion), and the arriving page
  dithers from the old one through the kit's `ditherViewTransition`: a
  right wipe (left going back through history) with a band of the signal
  ink, on the spring like every motion on the site. `app/page-reveal.ts` owns the hand-off: `PAGE_REVEAL_SCRIPT`,
  inlined first in each route's head by `rstack.config.ts` (`html.tags`,
  with the `PAGE_END_ID` marker it appends to each body), parks the
  `pagereveal` transition and holds the old page on screen until the app
  takes it; arriving from one of the pages it also holds the first frame
  to the marker (`<link rel=expect blocking=render>`), since Chromium drops
  a transition into a page it paints mid-parse (the 1.4 MB docs);
  `takePageTransition` hands it to main.ts in either order (that hold lets
  the app's deferred script run before the reveal). `tests/page-reveal.spec.ts`
  runs the inline script both ways. The theme toggle (`useTheme`'s
  `revealToggle`) dithers the new theme in as an iris from its control.
- Install and offline (the Studio is a PWA; the landing and the docs are
  not): `app/offline.ts` names the app's path (`OFFLINE.app`, `studio/`)
  that the manifest's place, the worker's scope and its kept page all
  read. `app/install-files.ts` is Node-side (rstack.config loads it;
  `.ts` imports): the app's manifest (`studio/app.webmanifest`; `id`,
  `start_url` and `scope` all `.`, standalone, the Studio's dark ground
  as background and theme, icons a folder up), every icon drawn from
  `MARK_CELLS` as a PNG it encodes itself (the maskable one's mark inside
  the 80% safe circle) and the tab's SVG, emitted by the `installFiles`
  plugin, and `installHead(entry)`, the one table the config injects
  each route's head from (the icons on every route; the manifest and
  iOS's app tags on `studio/index` only; the templates carry none). The
  worker's rules are pure: `strategyFor` reads URLs against the SITE's
  root, since the app's assets live outside its scope and every fetch a
  controlled page makes reaches the worker (pages network first;
  `static/` cache first, being named by content; the site's other files
  stale while revalidating; non-GET, range reads, other origins,
  `trailer/`, `og/`, `embed/`, `oembed/`, `play/` and the worker itself
  left to the network), `pageAssets` (what the app's page loads, kept at
  install), versioned cache names (a new `OFFLINE.version` drops the
  old), `inApp`, and `registerOffline`, which main.ts calls on every
  route: it registers only on the Studio's, after load, production
  builds only, scoped to the app. `app/sw.ts` only wires them to the
  worker's events (types of its own: the DOM and WebWorker libs cannot
  meet in one program) and is built alone as a classic script, the `sw`
  environment, at the site's root.
- `shared/ui/mascot.ts` is the mascot's one table (the brand's diamond
  come alive, ORIGINAL: an 11x15 cell grid, the body printed through the
  Bayer thresholds, eye holes, the mark's ember heart and antenna tips;
  poses idle, blink, hop, wave and fly, where the antennae fold into a
  rotor whose `turn` steps it round); `Mascot.vue` draws it as a
  decorative SVG in `currentColor`, blinks when `alive`, hops under a
  pointer and spins the rotor while it flies, all held still under
  reduced motion. Imported by path. Guarded by `tests/mascot.spec.ts`.
- `shared/ui/AdSlot.vue` never evaluates the EthicalAds client on the
  critical path: the slot loads only when it approaches the viewport AND the
  document is loaded plus a beat (8s-after-load safety net), and the aside it
  lives in is `display: none` under lg — phones never fetch it. The gate is
  IntersectionObserver on purpose: Safari has no `requestIdleCallback`.

## Verification

- `npx vue-tsc --noEmit` and `npx rs build` green before commit.
- The PWA on the built site: the Studio's head carries the manifest and
  the landing's and the docs' do not, Chrome finds the Studio installable,
  the landing registers no worker, and with the network cut the Studio
  opens (and a document from its hash) with the app mounted.
- Interactive checks in a real browser (agent-browser + screenshots) for
  anything visual or stateful (undo/redo walks, dialog focus, deep links).
- The video path on the built site (`rs preview`): the player seeked by
  synthetic `hf-seek` events gives identical bytes for identical times, the
  dialog's download opened from disk matches the player at the same time,
  and `npx hyperframes lint`/`render` accept the file. A reel seeked the
  same way shows the right clip, layers and mask state per time, requests
  no frames while directed, and its composition renders to an MP4 as long
  as the cut whose frames differ across the transitions.
- iOS: walk the built site in WebKitGTK (below) at an iPhone's size
  (390x844, an iPhone user agent) and an iPad's (1180x820, the Studio):
  no error on the landing, the docs or the Studio (a pass-through proxy
  that puts an error recorder first in each page's head reads them back,
  since classic WebDriver has no console), every brand moment playing
  home. A real device or the iOS Simulator remains the check for touch,
  audio and input zoom.
- Other engines: when Playwright's WebKit/Firefox builds cannot be fetched,
  WebKitGTK's own WebDriver (`apt install webkit2gtk-driver xvfb`, then
  `xvfb-run WebKitWebDriver --port=4447` and a W3C session on
  `webkit2gtk-4.1/MiniBrowser --automation`) drives the built site over
  plain HTTP: the same checks — container units resolved in a layer's
  computed transform, the world's canvas and WebGL engines, the Studio
  protocol and `clock.seek`, the player's `ditherClock` determinism — pass
  there, which is Safari's engine.
- Perf probes use the canonical trailing-slash URLs (`/docs/`, `/studio/`)
  — the directories the build writes; `rs dev`/`rs preview` also rewrite
  the slashless forms to them (`server.historyApiFallback`), static hosts
  may not.

## Child DOX Index

- `pages/AGENTS.md` — landing, docs, studio, play page contracts
- `widgets/workbench/AGENTS.md` — the docs previews' workbench: tools and
  keys, the stage coordinate system, the pointer surface, keyboard scope,
  the sanitized per-preview workspace, captures, the agent hand-off
- `widgets/source/AGENTS.md` — the docs previews' source files: the
  example, the kit's own files, tokens and prompt as tabs; edit, Run in
  the page (compiler-sfc, types stripped, linked to the page's Vue and the
  kit), download as a zip
