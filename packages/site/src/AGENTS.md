# src — site + studio app

## Purpose

The dither-ui.com site (landing, docs) and the studio editor, built on the
kit (the `@dither-ui/kit` package). Feature-Sliced Design (FSD) layering.

The app's source is this one tree, read through `@/`. A slice holds its
framework-free modules (models, pure logic, tables, stylesheets, fonts)
and its Solid components and Solid-bound modules (stores, hooks, the
agent client) side by side: a slice's component is beside the model it
stands on (`widgets/workbench/model/` beside
`widgets/workbench/Workbench.tsx`). A path written from a layer
(`features/agent/protocol.ts`, `pages/docs/DemoCard.tsx`) is under this
folder. A framework-free module imports no Solid and touches no DOM at
load, so the workspace's `rs test` can import it (its specs are
`../tests/*.spec.ts`); it takes the kit's values from `@dither-ui/kit/engine`,
never from `@dither-ui/kit`, whose index is the components. Where a
framework-free module and its Solid binding would share a name, each has
its own (`shared/lib/rise.ts` and `shared/lib/rise-ref.ts`,
`widgets/source/model/snippet.ts` and `widgets/source/model/files.ts`):
no file re-exports another to stand in its place. The SolidStart package
around this tree (entries, routes, the build, how Solid is written) is
`../AGENTS.md`'s.

## Ownership

- `app/` — global styles/tokens (`styles.css`), the page transition's
  hand-off (`page-reveal.ts`), the wait for the page's stylesheets before
  the app mounts (`sheets-ready.ts`), the install surface (`install-files.ts`)
  and the Studio's service worker (`sw.ts`, its rules in `offline.ts`).
  The entries, the shell and the routes stand at the tree's top
  (`entry-client.tsx`, `entry-server.tsx`, `app.tsx`, `routes/`).
- `pages/` — landing, docs, studio, play (see `pages/AGENTS.md`).
- `widgets/` — the site's one `site-header` (the landing's and the docs'
  capsule, a page's tools in its slot, the menu's bottom sheet of tone
  bands under lg; see `pages/AGENTS.md`, Header), the docs previews' and the Studio canvas's `workbench` (inspect, measure,
  annotate, capture; see `widgets/workbench/AGENTS.md`) and `source` (the
  preview's files, edited and run in the page; see
  `widgets/source/AGENTS.md`) and the studio
  panels: toolbar (the title bar and the canvas bar), layer-tree,
  inspector, canvas,
  chart-renderer, widget-renderer, reel-renderer (a reel's clips on the kit
  clock; a film's camera, callouts and chapter band), data-editor, agent
  (the composer / harness control plane: `AgentPanel.tsx` holds the
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
  and the pinch rebases on whichever pair remains; the canvas touch cases
  of `tests/site/render.spec.tsx`;
  it reads `editor.viewport` at each use, never a kept copy, since loading
  a document, switching a project or centring a fresh frame replaces it;
  the pan-zoom cases of `tests/site/state.spec.tsx`; the zoom keys, the canvas
  bar and the agent's
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
  ContextMenu, ...; `ToolMark` over `marks.ts` — the real one-colour marks of
  npm, pnpm, Bun, Node, Solid, Tailwind, StyleX, CSS Modules, CSS, GitHub and
  the coding agents the bridge starts (keyed by its harness ids), from Simple
  Icons (CC0), LobeHub (MIT) and the tools' own site icons, paths verbatim;
  their owners' trademarks, shown only beside the tool's name, never restyled,
  dithered or put in the kit; imported by path, never through the `shared/ui`
  barrel, which would pull every shared component into the landing's first
  load; `Segmented` takes `labels` where an option's value is not how a reader
  writes it), config (CHART_TYPES; `titles.ts`, the routes' titles, a leaf the
  landing can load without the docs IA), lib (theme, routes (with `safeUrl`,
  the ONE test of a URL a document may carry into an href or a src: http(s),
  mailto, a raster `data:` image or a relative path, read as the browser reads
  it), base64, menu, `storage.ts` — the ONE path to localStorage
  (`storage.get/set/remove`, `readJson` → `unknown` for the caller to parse,
  `writeJson`), never throwing where storage is blocked or full — `sfc.ts` —
  the ONE way the code generators put a document value into a component file
  (`js` for a literal, `key`, `objectLiteral`, `prop` for an attribute, `text`
  for JSX text, `comment`, `px`), so exported code carries values as data,
  never as code — `sound.ts` — Kobra's interface sounds as WebAudio voices
  behind one remembered switch (`sounds`, localStorage `dither-sounds`; a
  context WebKit left suspended or interrupted resumes on the next cue) —
  `long-press.ts` — `installLongPress`, the Studio's polyfill for the
  contextmenu iOS never fires: a touch held still 500ms dispatches one at the
  finger, and when a menu took it (its handler prevented the default) swallows
  the click its release makes (a cancelled touch makes none, and a press on
  nothing keeps its click); a moving finger, a mouse, a text field and the
  platform's own menu (Android) are left alone (`tests/long-press.spec.ts`) —
  `glide.ts` — the hover ground (the user's call, after a page they made):
  one filled ground travels under the pointer from link to link in a row
  (`ref={glide}`, `glide-ref.ts`; the header's nav), placed at once on the
  first entry, a hand's movement on the glide, fading on a colour's time;
  a finger never drives it, a keyboard keeps the focus ring
  (`.glide-ground` in `app/styles.css`; `tests/site/glide.spec.tsx`) —
  `spring.ts` — the hand's spring (`HAND_SPRING`: response 0.35s, bounce
  0.25; the user's lift of the glide for direct manipulation only):
  `springAt` (the closed form from a position and a velocity),
  `springLinear` (its CSS `linear()` over `SPRING_MS`, copied into
  `app/styles.css` as `--ease-spring` behind `@supports`) and `springTo`
  (on the frame clock, for a drag let go; `tests/spring.spec.ts`) —
  `press.ts` — `installPress`, set once by `entry-client.tsx`: a pointer
  down on a key (`PRESSABLE`: `.key`, `.key-chrome`, `.nav-a`,
  `.seg > button`, or what opts in with `data-press`, `"card"` giving
  less) marks it `data-pressed="down"`, let go (or cancelled) `"up"` once
  its 90ms travel has played, unmarked when its spring ends; a card only
  where none of its controls, links or canvases took the press; nothing
  under reduced motion; `app/styles.css` moves it, a `scale` of its own,
  so a key's transitions and layout stay (`tests/site/press.spec.tsx`) —
  `scroll-scene.ts` — scroll scenes: `scrollScene(el, range)`
  (`scroll-scene-ref.ts`: `ref={scene(range)}`) writes `--scene`, 0 to 1
  on the glide, from where the element is laid out (its own transform
  left out) between two moments of its passage, or through the span its
  sticky first child (never moved itself) is pinned; one driver: an
  IntersectionObserver holds the scenes near the viewport (`SCENE_NEAR`),
  and only while one is near does the scroll read their boxes in the
  frame, then write; a scene gone past stands at its end above the view,
  its start below; nothing under reduced motion, and a scene's stylesheet
  moves only by transform and opacity under
  `prefers-reduced-motion: no-preference` (`tests/scroll-scene.spec.ts`,
  `tests/site/scroll-scene.spec.tsx`) —
  `files.ts` — `download()` and a stored .zip of text files, the ONE download
  path for the Studio's exports, the workbench and the source panel —
  `words.ts` — `breakable`, a camelCase name with a break point at each hump,
  for display only (the inspector's names) — `restyle.ts` — the reader's
  choice of styling system, kept across visits, over the `@dither-ui/restyle` package (a
  snippet in that system, the node-side utility map and the kit's StyleX
  generator: see `packages/restyle/AGENTS.md`); `kit-sources.ts` — the one
  rule for which kit files the build serves; `gif.ts` — the ONE GIF encoder
  (one palette, `keep` colours held exact, optional ordered dither, delta
  frames), import-free because the share-card renderer carries its source
  inline: the workbench's captures and the share cards both go through it);
  `inspect/` — what the live DOM reads as (`color.ts`: parse, print, WCAG
  contrast; `geometry.ts`: boxes and segments; `measure.ts`: boxes, box model,
  type, role/name/states, Tab order and the accessibility audit, boxes at a
  `scale` for a zoomed canvas), read by the workbench and by the agent's
  `inspect`, imported by path).
- Untrusted input is parsed ONCE where it enters, into a type nothing past
  it re-checks: documents through `parseDocument` / `normalizeArtboard`
  (each field of several shapes, a glow, a texture, an easing, parsed whole
  so every shape the editors write survives; a `url` prop, an image's or an
  avatar's address through `safeUrl`), stored values through `storage.ts`
  and a parser at the reader, bridge messages through a parser in `acp.ts`
  (`permissionOptions`). Pinned by `tests/security.spec.ts` and
  `tests/site/codegen.spec.tsx` (hostile labels, keys, props and
  slot text through both code generators and Solid's own compiler).
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
  `tests/field-label.spec.ts`. A component with a two-way value (a field's
  value, the chips' pick; the registry's `model` row) keeps it as `model`, which `sanitizeModel` takes
  from untrusted input (a file, `component.add`'s or a screen cell's
  `value`, `artboard.update`'s `widget.value`) only in the kind of the
  entry's default and under `MODEL_MAX`, else the default;
  `tests/field-values.spec.ts`. Every public `Dither*` export is covered
  there or by a bespoke widget kind. `TEXT_SAMPLES` beside the rows gives
  a text prop read as a value (a locale, a currency, a CSS length) the
  second value `tests/site/paint-law.spec.tsx` changes it to.

## Local Contracts

- Layer imports flow downward only: pages → widgets → features → entities →
  shared. The kit (`@dither-ui/kit`) may be imported from any layer; nothing
  imports back into it.
- Canonical routes are `/`, `/docs[/section]`, and `/studio`, plus the
  `noindex` player at `/play/`; legacy
  `#/docs[/section]` and `#/studio[/new/<type>]` links remain supported.
  Any other address (`isLanding` in `shared/lib/routes.ts` says which are
  the landing's: the root and its entry file; `tests/titles.spec.ts`) is
  the `missing` route, `MissingPage` (see `pages/AGENTS.md`), which the
  build keeps as `404.html` for the host to serve. Each page's
  crawler-visible metadata is rendered into its file from one head table
  (`pages/docs/heads.ts`, its titles `shared/config/titles.ts`
  `ROUTE_TITLES`; `tests/site/heads.spec.tsx`), a docs section's
  from `seo.ts` (see `pages/AGENTS.md`). The routes are SolidStart's file
  routes (`AGENTS.md`); a legacy hash address is sent to its
  page before the app mounts (`shared/lib/legacy.ts`). Internal app links
  and public asset URLs use `routePath()` /
  `assetPath()` from `shared/lib/routes.ts` so the same build works at `/` and
  at the GitHub Pages project base.
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
  selected. The placement cases of `tests/site/state.spec.tsx`.
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
    `tests/site/state.spec.tsx` holds to the registry's list) with its
    row in the composer's `STEPS` (`widgets/agent/model/steps.ts`).
  - `registrySchema()` is the machine-readable registry (every component's
    prop specs, chart/widget kinds, document shape, commands); the
    post-build (`build/postbuild.mjs`) reads it off the
    mounted studio and writes `agent/registry.json` into the build. The skill that
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
    carries a copy of, pinned by `tests/site/state.spec.tsx`; `callStudioTool`
    runs
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
    is reported as a step (`onStep`). Guarded by the `dither` cases of
    `tests/site/state.spec.tsx`.
  - `sandbox.ts`: where a built tool runs. `runSandboxed(code, args,
    call)` puts `sandboxDocument()` in an iframe with `sandbox="allow-scripts"`
    and no allow-same-origin (no page, cookies or storage), a CSP of
    `default-src 'none'` (no request of any kind), and a blob worker
    (`workerSource`: `studio.run` over messages, then the code as the body
    of an async function of `(args, studio)`) behind one `MessageChannel`;
    past `SANDBOX_MS` or `SANDBOX_CALLS` the frame goes, the worker with it.
    Proven in Chromium by `tests/site/sandbox.spec.ts` (answers through
    `studio.run` only; fetch, script imports and sockets refused with no
    request reaching a local server; no document, parent or storage; an
    endless loop stopped while the page answers; parse and throw errors
    reported).
  - `chats.ts` (imported by path, so the page never pulls the protocol):
    a project's chats, the `chats` store shared by the Studio's
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
    the chats cases of `tests/site/state.spec.tsx`.
  - `acp.ts`: the composer as an Agent Client Protocol client over a
    loopback websocket to `packages/bridge/src/dither-bridge.mjs` (see
    `packages/bridge/AGENTS.md`
    for the wire contract). Nothing at the address rejects with
    `NoBridge`, which the panel answers with its setup card, never a raw
    error; `bridgeCommand(page, file, bridgeUrl)` is that card's line
    (the file the site serves at `BRIDGE_FILE`, from `bridge-file.ts`,
    which imports nothing so `build/site-files.ts` reads it too; `--origin`
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
    request. Pinned by the protocol, evolve and tools cases of
    `tests/site/state.spec.tsx`; the bridge chain by
    `tests/bridge.spec.ts`.
- Styling systems: `packages/restyle/src/index.ts` is the ONE translator.
  It reads and writes Solid only: `restyleSolid(code, system, name)` rewrites
  the `class` and `style` attributes of a Solid file into named styles and
  hands back the stylesheet the `.tsx` imports on `css` or `modules`
  (`stylex` writes `stylex.create` with `{...stylex.props()}` on the
  element), and `restyle(code, system)` is the two as one text, the sheet
  under the code; `tailwind` returns the code untouched. A docs snippet is
  written in Solid, so it reaches the rewriter as it is. Its data is
  `virtual-dither-utilities`: `@dither-ui/restyle/utility-map` (node-side only: the Vite
  plugin `build/utilities.ts`, and `rstack.config.ts` for the framework-free
  specs) scans `UTILITY_SOURCES` (`build/utility-sources.ts`: `pages/docs` and
  `entities`) with Tailwind's scanner and compiles every candidate with
  Tailwind's compiler (theme inlined; the kit's `@theme inline` tokens and
  dark variant read from `@dither-ui/kit/tailwind/kit.css`), keeping per class its
  cascade index, its variant chains and declarations, plus the `@property`
  initials. `compileUtilities(tokens, strict, map)` merges a class list in
  Tailwind's order (so `px-2 p-4` cascades as Tailwind does), resolves every
  `--tw-*` input to the end (a ring with an offset nests a dozen), folds
  Tailwind's `@supports (color: color-mix(...))` guard into its rule (every
  supported browser passes it), simplifies `calc()`s and drops no-op shadows;
  `map` defaults to the docs' vocabulary, and the kit layer generator's spec
  passes the kit's (`buildUtilityMap(root, ["@dither-ui/kit/solid",
  "@dither-ui/kit/tailwind"])`). StyleX comes out as its compiler takes it: a
  pseudo-element is a top-level key holding its own properties
  (`"::placeholder": { color }`), vendor properties are spelled
  `WebkitLineClamp`. Unknown classes stay classes (the kit stylesheet covers
  them); for StyleX so does any class whose rule needs a selector it cannot
  express, a custom property or `!important`, and a dynamic binding only
  becomes `attrs()` arguments when its shape allows (literal / ternary / `&&`
  / array / object; a ternary or `&&` takes any condition, an empty branch is
  `null`, an array converts whole or not at all). In every target only the
  literals in class position are named (a ternary's arms, the right of `&&`,
  array items, object keys), so a condition's string (`view === 'grid'`) stays
  a value. Names come from the element (`stack`, `row`, `grid`, `layer`,
  `frame`, `box`, `text`, a component's name without `Dither`, a literal's
  first utility), one per distinct rule set, inline `style` folded into the
  element's rule. The preference (`shared/lib/restyle.ts`'s signal,
  localStorage `dither-styling`) is shared by the docs and the Studio.
  `code.get { id, styling? }` and the `get_code` tool return the component
  restyled (`tailwind` default, junk fails); the export dialog's `styling`
  control does the same for the copy and the download. New vocabulary is
  picked up by the next build or dev server start. The docs' Run plays the
  restyled example in any system, StyleX through
  `widgets/source/model/stylex.ts`. Pinned by
  `packages/restyle/tests/restyle.spec.ts`, `tests/stylex-coverage.spec.ts`
  (every docs snippet written as StyleX leaves no Tailwind class; only a
  snippet's own CSS hooks stay classes), `tests/site/solid-code.spec.tsx`
  (a file and a fragment in each system), and the export and `code.get` cases in
  `tests/site/codegen.spec.tsx` and `state.spec.tsx`.
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
  single-file bundle is `play/player.js` + `player.css` (one classic
  script, no async chunks, every asset a data URI), built with the site by
  `build/standalone.ts`; `playerAssets()`
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
  `tests/site/state.spec.tsx`, and the file case in `tests/bridge.spec.ts`.
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
  `REEL_POOL` context (the player provides its document's frames) or the
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
  answers a comment — a reel has no component file, it is a video. UI: the toolbar's
  `reel` action cuts the selection in selection order (hidden when only
  reels are selected); the inspector's `ReelPanel` edits length, transition
  kind/seconds/cell per clip, reorders, removes, adds from a picker. Pinned
  by `tests/reel.spec.ts` (timeline, model), `tests/site/carried-reel.spec.ts`
  (the store and the protocol) and the reel renderer cases of
  `tests/site/render.spec.tsx` (on a seeked clock).
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
  row under it. Pinned by `tests/reel.spec.ts` (the "film" cases),
  `tests/site/carried-reel.spec.ts`, the renderer cases of
  `tests/site/render.spec.tsx` and `packages/dither-kit/tests/score.spec.ts`.
- Keyboard map lives in `features/keyboard/useShortcuts.ts` (the canvas's
  keys in `useShortcuts`, the page's own in `usePanelShortcuts`, read
  through one table, `pageKeyOf`: ⌘K search, ⌘I the chat, ⌘B the
  sidebar from anywhere, ⌘⇧↑ / ⌘⇧↓ the chat before or after outside a
  field; the canvas's arrows nudge only without ⌘); every new shortcut
  also gets a row in `ShortcutsHelp.tsx`.
- Pointer transforms use `features/artboard-transform`'s `startDrag`; it filters by
  pointer id and owns pointer-up/cancel/unmount cleanup. Artboard surfaces drag
  only from non-interactive regions so live controls retain pointer ownership.
- Move, nudge, duplicate, delete, lock, and group commands act on the complete
  selection; locked members remain stationary.
- Toolbar hierarchy: project, insertion and panels in the title bar; the
  view, the selection's edit, data and export actions and Inspect in the
  canvas bar (`widgets/toolbar/CanvasBar.tsx`, over the canvas's foot,
  always there, its keys disabled rather than removed). Project file
  import/export stays in the project menu.
- Studio lifecycle watchers are singletons while the route is mounted:
  `startAutosave`/`startHistory` replace prior handles and StudioPage stops them
  on unmount. Route revisits must not accumulate deep watchers.
- A11y floor: icon-only buttons carry `aria-label` (+ `aria-pressed` for
  toggles); dialogs use `role="dialog" aria-modal`, close on Escape, focus on
  open and TRAP Tab — app dialogs wrap their panel in the kit's
  `DitherFocusScope` (ExportDialog with `autofocus=false`, its own close
  button taking focus as it opens, since it mounts lazily with
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
  (`[@media(hover:none)]`). A press gives under a finger as under a mouse
  (`shared/lib/press.ts`, pointer events, so WebKit's missing `:active`
  on a tap never matters), and the site's menu under lg is a bottom sheet
  a finger drags down (`pages/AGENTS.md`, Header).
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
  with `aria-selected`, Enter/Space select (only when the row itself is
  the target, so rename inputs don't retrigger), ↑/↓ move focus and MUST stopPropagation — the same keys
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
  of delete, remove and a failed read, is the ember (`--swatch-orange`,
  the one signal accent: red is the user's reject), 4.5:1 on the theme's
  grounds (`tests/theme-contrast.spec.ts` follows the reference); a
  scoped rule that colours a key outranks the utility, so a key wearing
  both carries its own `.key.text-destructive` rule, which
  `tests/destructive-ink.spec.ts` checks across this tree), and
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
  `--float-shadow`, `--ease-settle` (the glide: the kit's
  `GLIDE_BEZIER`; also Tailwind's default transition curve, so every
  `transition-*` utility glides; `tests/motion.spec.ts` holds both
  sites' copies to the kit and finds no other curve or linear wipe in the
  site's motion), `--ease-spring` and `--spring-time` (the hand's spring
  as `linear()`, the glide where it is not supported; only what the hand
  moves directly), `--press-time` (a press's travel down), the press's
  rules (`[data-pressed]`, `@keyframes press-down` and `press-up`,
  `--press-scale`), `--cut` (16px), `--display-face`
  (Michroma, then the mono; the `font-display` utility reads it; its
  `@font-face` is `shared/fonts/display.css`, imported by the landing and
  the docs only, never by the player, whose bundle inlines every asset).
  Classes:
  `.chrome-type` (the ramp clipped to the glyphs, one horizon per line),
  `.spec` (spec label: uppercase, tracked, 10px) and `.speed-tag` (a
  slanted plate), the ONLY uppercase in the site's own chrome;
  `.hardshell` (two corners cut by `clip-path`, which clips what it
  holds, fixed descendants included; a chrome-glint ring along the cut;
  the shell ground (no fasteners or other manufacturing theater: the
  user's brief keeps one credible joint, the cut); set `--cut`
  locally for a smaller cut), only for a page's one shaped hero panel
  (the Studio's canvas, a dialog); `.flat-shell` (its flat sibling for
  every other panel: the shell ground, one hairline, a 10px radius);
  `.gel` (an
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
- Entry (`src/entry-client.tsx`) mounts the app, deliberately
  NOT hydration: the prerendered page is what a crawler reads and what
  paints first, and kit components gate on measured state (chart
  `ctx.ready`, mount flags), so a first client render never matches the
  settled bytes. Don't try hydration without first making first render
  equal settled state. The display face is preloaded with each page's
  HTML, and each page's head carries the site's speculation rules
  (`speculationRules` in `app/page-reveal.ts`: the landing and the docs
  rendered ahead when a pointer rests on a link to them, the Studio only
  fetched, the cards' renderer, the player and the kit's sources never;
  Chromium only, and off under DevTools), both set by the shell
  (`src/entry-server.tsx`). `tests/first-paint.spec.ts`.
- Docs sections are DIRECT children of `.docs-flow`: the page shows one
  at a time by toggling `hidden` on them (`pages/AGENTS.md`, Wayfinding),
  and each is prerendered as its own page (`routes/docs/[section].tsx`).
  A section a pack renders is mounted only once opened (`docs/packs.ts`,
  `packOpen`; the last `PACKS_KEPT` packs read stay mounted): a new pack
  is a row in `PACKS` and a `mounted(...)` gate in `DocsPage.tsx`.
  New section wrappers must stay direct children of `.docs-flow`.
- Page transitions: the routes (`/`, `/docs`, `/studio` and the section
  pages) opt into cross-document view transitions in `app/styles.css`
  (`@view-transition`, none under reduced motion), and the arriving page
  dithers from the old one through the kit's `ditherViewTransition`: a
  right wipe (left going back through history) with a band of the signal
  ink, on the glide like every motion on the site. `app/page-reveal.ts` owns the hand-off: `PAGE_REVEAL_SCRIPT`,
  inlined first in each site page's head by the shell
  (`src/entry-server.tsx`, with the `PAGE_END_ID` marker at
  the end of each body), parks the
  `pagereveal` transition and holds the old page on screen until the app
  takes it; arriving from one of the pages it also holds the first frame
  to the marker (`<link rel=expect blocking=render>`), since Chromium drops
  a transition into a page it paints mid-parse;
  `takePageTransition` hands it to `entry-client.tsx` in either order (that hold lets
  the app's deferred script run before the reveal). `tests/page-reveal.spec.ts`
  runs the inline script both ways. The rise (`shared/lib/rise.ts`: a
  headline's words up one after another on the glide, 24px over 900ms,
  60ms apart, then its blocks 90ms apart; the site's `rise(el)` is
  `shared/lib/rise-ref.ts` over it) waits in the
  prerendered bytes:
  `RISE_HEAD_SCRIPT` (`shared/lib/rise-wait.ts`, inlined after the reveal
  script) sets `rise-wait` on `<html>` unless the reader asks for reduced
  motion, styles.css keeps unrisen `[data-rise]` out of sight under it,
  and the app takes over (`data-rise="live"`) or the wait lets go after
  3s. The theme toggle (`useTheme`'s
  `revealToggle`) dithers the new theme in as an iris from its control.
- Install and offline (the Studio is a PWA; the landing and the docs are
  not): `app/offline.ts` names the app's path (`OFFLINE.app`, `studio/`)
  that the manifest's place, the worker's scope and its kept page all
  read. `app/install-files.ts` is also read Node-side
  (`build/site-files.ts` loads it; `.ts` imports): the app's manifest
  (`studio/app.webmanifest`; `id`,
  `start_url` and `scope` all `.`, standalone, the Studio's dark ground
  as background and theme, icons a folder up), every icon drawn from
  `MARK_CELLS` as a PNG it encodes itself (the maskable one's mark inside
  the 80% safe circle) and the tab's SVG, all listed by `installFiles()`
  and emitted by the `siteFiles` plugin, and the head tables the pages
  render (`ICON_HEAD`, the icons, on every site page from the shell;
  `APP_HEAD`, the manifest and iOS's app tags, on the Studio's route
  only). The
  worker's rules are pure: `strategyFor` reads URLs against the SITE's
  root, since the app's assets live outside its scope and every fetch a
  controlled page makes reaches the worker (pages network first;
  `_build/assets/` cache first, being named by content; the site's other files
  stale while revalidating; non-GET, range reads, other origins,
  `trailer/`, `og/`, `embed/`, `oembed/`, `play/` and the worker itself
  left to the network), `pageAssets` (what the app's page loads, kept at
  install with the build's own list of the Studio's chunks, `buildKeep`,
  which `build/standalone.ts` defines as it builds the worker),
  versioned cache names (a new `OFFLINE.version` drops the
  old), `inApp`, and `registerOffline`, which the Studio's route calls
  as it mounts: it registers only on the Studio's path, after load,
  production builds only, scoped to the app. `app/sw.ts` only wires them to the
  worker's events (types of its own: the DOM and WebWorker libs cannot
  meet in one program) and is built alone as a classic script
  (`build/standalone.ts`), at the site's root. Guarded by
  `tests/install.spec.ts` and `tests/site/worker-player.spec.tsx`.
- `shared/ui/mascot.ts` is the mascot's one table (the brand's diamond
  come alive, ORIGINAL: an 11x15 cell grid, the body printed through the
  Bayer thresholds, an eye hole beside an ember optic that never shuts,
  the mark's ember heart and antenna tips;
  poses idle, blink, hop, wave and fly, where the antennae fold into a
  rotor whose `turn` steps it round); `Mascot.tsx` draws it as a
  decorative SVG in `currentColor`, blinks when `alive`, hops under a
  pointer and spins the rotor while it flies, all held still under
  reduced motion. Imported by path. Guarded by `tests/mascot.spec.ts`.
  `car.ts` is the mascot's car on the same cell grid (an original wedge
  speedster: the body printed like the mascot's, an ember stripe, the
  brand's diamond on the door, ember tail light, bone headlight, wheels
  whose spokes turn a step a frame), `drivenCells` seats the mascot in
  its cockpit (only what stands over the door line shows);
  `MascotCar.tsx` draws them, its wheels turning while `driving`, still
  under reduced motion. Guarded by `tests/car.spec.ts`.
  `mascot-capture.ts` grows the table into a Gaussian capture of our own
  (a cut stone of splats, a dark eye and an ember optic on both faces, three ember orbits),
  seeded; the build serves it at `CAPTURE_PATH` (the `siteFiles` plugin,
  never a copy in `public/`) and the docs' World
  section prints it. Read by `tests/splats.spec.ts`.
- `shared/ui/AdSlot.tsx` never evaluates the EthicalAds client on the
  critical path: the slot loads only when it approaches the viewport AND the
  document is loaded plus a beat (8s-after-load safety net), and the aside it
  lives in is `display: none` under lg — phones never fetch it. The gate is
  IntersectionObserver on purpose: Safari has no `requestIdleCallback`.

## Verification

- The root `AGENTS.md` gate, green before commit: the lint, the format,
  the types, the framework-free and component specs (`npm test`) and the
  build, all from the workspace root.
- The PWA on the built site: the Studio's head carries the manifest and
  the landing's and the docs' do not, Chrome finds the Studio installable,
  the landing registers no worker, and with the network cut the Studio
  opens (and a document from its hash) with the app mounted.
- Interactive checks in a real browser (agent-browser + screenshots) for
  anything visual or stateful (undo/redo walks, dialog focus, deep links).
- The video path on the built site (`npm run preview`): the player seeked by
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
  — the directories the build writes; static hosts may not answer the
  slashless forms.

## Child DOX Index

- `pages/AGENTS.md` — landing, docs, studio, play page contracts
- `widgets/workbench/AGENTS.md` — the docs previews' workbench: tools and
  keys, the stage coordinate system, the pointer surface, keyboard scope,
  the sanitized per-preview workspace, captures, the agent hand-off
- `widgets/source/AGENTS.md` — the docs previews' source files: the
  example, the kit's own files, tokens and prompt as tabs; edit, Run in
  the page (Solid's compiler, types removed, linked to the page's Solid
  and the kit), download as a zip
