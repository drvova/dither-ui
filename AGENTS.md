# DOX framework

- DOX is highly performant AGENTS.md hierarchy installed here
- Agent must follow DOX instructions across any edits

## Core Contract

- AGENTS.md files are binding work contracts for their subtrees
- Work products, source materials, instructions, records, assets, and durable docs must stay understandable from the nearest applicable AGENTS.md plus every parent AGENTS.md above it

## Read Before Editing

1. Read the root AGENTS.md
2. Identify every file or folder you expect to touch
3. Walk from the repository root to each target path
4. Read every AGENTS.md found along each route
5. If a parent AGENTS.md lists a child AGENTS.md whose scope contains the path, read that child and continue from there
6. Use the nearest AGENTS.md as the local contract and parent docs for repo-wide rules
7. If docs conflict, the closer doc controls local work details, but no child doc may weaken DOX

Do not rely on memory. Re-read the applicable DOX chain in the current session before editing.

## Update After Editing

Every meaningful change requires a DOX pass before the task is done.

Update the closest owning AGENTS.md when a change affects:

- purpose, scope, ownership, or responsibilities
- durable structure, contracts, workflows, or operating rules
- required inputs, outputs, permissions, constraints, side effects, or artifacts
- user preferences about behavior, communication, process, organization, or quality
- AGENTS.md creation, deletion, move, rename, or index contents

Update parent docs when parent-level structure, ownership, workflow, or child index changes. Update child docs when parent changes alter local rules. Remove stale or contradictory text immediately. Small edits that do not change behavior or contracts may leave docs unchanged, but the DOX pass still must happen.

## Hierarchy

- Root AGENTS.md is the DOX rail: project-wide instructions, global preferences, durable workflow rules, and the top-level Child DOX Index
- Child AGENTS.md files own domain-specific instructions and their own Child DOX Index
- Each parent explains what its direct children cover and what stays owned by the parent
- The closer a doc is to the work, the more specific and practical it must be

## Child Doc Shape

- Create a child AGENTS.md when a folder becomes a durable boundary with its own purpose, rules, responsibilities, workflow, materials, or quality standards
- Work Guidance must reflect the current standards of the project or user instructions; if there are no specific standards or instructions yet, leave it empty
- Verification must reflect an existing check; if no verification framework exists yet, leave it empty and update it when one exists

Default section order:
- Purpose
- Ownership
- Local Contracts
- Work Guidance
- Verification
- Child DOX Index

## Style

- Keep docs concise, current, and operational
- Document stable contracts, not diary entries
- Put broad rules in parent docs and concrete details in child docs
- Prefer direct bullets with explicit names
- Do not duplicate rules across many files unless each scope needs a local version
- Delete stale notes instead of explaining history
- Trim obvious statements, repeated rules, misplaced detail, and warnings for risks that no longer exist

## Closeout

1. Re-check changed paths against the DOX chain
2. Update nearest owning docs and any affected parents or children
3. Refresh every affected Child DOX Index
4. Remove stale or contradictory text
5. Run existing verification when relevant
6. Report any docs intentionally left unchanged and why

## Project Facts

- dither-ui: a dithered UI toolkit for SolidJS (dither-ui.com). Three
  parts: `dither-kit/` (the portable component
  library), `solid-site/` (the site: landing, docs, Studio, player) and
  `src/` (the site's framework-free modules, which `solid-site/` imports
  through `@/` and never copies).
- Folder names: `dither-kit/solid`, `dither-kit/solid-stylex` and
  `solid-site` keep their names; no rename is decided.
- Stack: SolidJS and SolidStart 2 (on Vite, Nitro's `static` preset, every
  page prerendered), TypeScript strict, Tailwind v4, d3-scale/d3-shape. No
  emojis in code.
- Toolchain, two CLIs. At the root the Rstack CLI (`rs`, the `rstack`
  package, one config `rstack.config.ts`, Node 22) runs what is not the
  site's build: `define.test` is Rstest (`rs test`, the framework-free
  specs in `tests/`), `define.lint` is Rslint (`rs lint`, the whole
  repository's TS/JS, the site's and the kit's `.tsx` included),
  `define.fmt` the formatter (`rs fmt`). The site has its own CLI in
  `solid-site/` on Node 24 (SolidStart needs it): `vite` (`dev`, `build`,
  `preview`), `vitest` (the component and site specs in
  `solid-site/tests/`) and `tsc`. The root's `npm run dev`, `build`,
  `preview` and `typecheck` hand over to it. One type program: the root
  `tsconfig.json` only references `solid-site/`, whose `tsc` checks the
  site, the kit's layers, the engine, `src/`, `scripts/`, `benchmarks/`
  and every spec, the root's included. Config files load under Node's own
  TypeScript, so a module one imports at run time (`utility-map.ts`,
  `crawler-files.ts` and its graph: `groups.ts`, `seo.ts`, the `*-nav.ts`
  packs) writes relative imports WITH `.ts`. `benchmarks/node-bench.mts` is the
  kit's raster micro-benchmark, run by hand in Node, never part of a build.
- The site's build (`npm run build` in `solid-site/`): `vite build`
  prerenders every page into `solid-site/.output/public` (the landing,
  `/docs` and one page a docs section, the Studio, the player, and the
  missing page kept as `404.html`; links crawled, a link to nothing fails
  it), with the files the plugins at the package root emit beside them:
  `site-files.ts` (the crawler files, the cards' manifest and embeds, the
  install surface, the mascot's capture, the bridge), `kit-sources.ts`
  (the kit's own source at `kit/src/solid/` with a `files.json`
  listing: what the docs' source panel shows, runs and zips),
  `standalone.ts` (`sw.js` and the single-file player `play/player.js` +
  `player.css`), `utilities.ts` (the styling rewriter's utility map) and
  `run-compiler.ts` (what the docs' Run needs to load Solid's compiler in a
  browser). Then `scripts/postbuild.mjs`, which needs a Chromium
  (`CHROME_PATH` or a standard install) and fails loudly without one:
  the kit stylesheet, the share card renderer and every card, each
  section's embed with its own lede, and the agent registry read off the
  mounted Studio. Details in `solid-site/AGENTS.md`.
- Aliases: `@` → `src/`; `@dither-kit` → the kit's Solid layer
  (`dither-kit/solid/index.ts`), `@dither-kit/<layer>/<file>` → a file of
  a layer (`engine/`, `tailwind/`, `solid/`, `solid-stylex/`); `~` →
  `solid-site/src/` (`solid-site/aliases.ts` + its `tsconfig.json` paths:
  change both together). Under `rs test` nothing renders a component, so
  there `@dither-kit` alone is the engine's public API
  (`dither-kit/engine/api.ts`, `rstack.config.ts`).
- Canonical routes: `/` landing · `/docs[/section]` · `/studio`; legacy hash
  routes remain supported for old links; any other address shows the
  missing page (noindex, the landing's print). GitHub Pages deploys through
  `.github/workflows/pages.yml`: the type check, then the site's build,
  and `solid-site/.output/public` uploaded as it is (with a `.nojekyll`,
  or Pages drops the build's `_build/` folder), so the live site paints
  from bytes and every sitemap URL is a real page. Default deploy base is
  `/` because `public/CNAME` sets `dither-ui.com`. Set repo variable
  `BASE_PATH=/dither-ui/` only when removing the custom domain and using
  the GitHub Pages project URL; the same build runs under it.
- Assets: `public/faces.webp` is the measured portrait/emote band (rows
  766..900 of the source sheet, transparency baked in; the Studio's image
  widget defaults to it); `public/sprites.webp` is the broader character
  sheet. `public/emotes/` holds alpha-keyed per-sprite crops of that band,
  measured in the browser, never eyeballed: the faces at y 0, 126 tall,
  x/width 29/97, 147/97, 262/95, 378/98, 497/96, 832/94; their emotes
  x,y,w,h 1503,25,51,49; 1273,27,42,38; 1270,92,36,41; 1529,98,25,27;
  1458,24,20,47; 1334,23,40,40. Regenerate from the sheet, don't
  hand-draw. They decorate the README. The README's screenshots live in
  `.github/readme/` (WebP, never shipped with the site), taken from a
  production build: retake the one whose page changes.
- Landing surfaces: everything that moves on the landing is the kit
  itself (the user's call after the trailer: show the real components,
  hands on, never drawings of them). The page is printed: one obsidian
  in the dark, ALWAYS (the user's call): one bone ink on obsidian with a
  fine grain, no frame or side lines, the kit's
  art the only colour on it (the taste of a reference print site the
  user picked, kept unnamed, worn so it never reads as a copy: none of
  its devices). Our own hero (the statement beside a live print the kit
  makes, no component tour: the user's call; a poster of tone fields and the
  kit's diamond standing over its own dithered floor; a quiet line of what
  it works with under the keys, signed off with the brand forming out of
  the open field before the print starts (the brand forms its own way in
  each place it stands: the hero, each plate, the footer); copy calm and procedural, warm with a wink, every figure
  read from the kit), then
  sections under a title with a lead beside it, print plates of the brand
  small in a wide field between them (after the bento and after the
  three parts, each its own proportion and printer's screen, each a sheet
  of the heat that builds up through the page to the close, the pointer
  printing on every section's ground): a bento of live
  components, the brand's lockup built cell by cell from the wire as the
  page scrolls (`#build`), one agent session played as the page scrolls (a pinned
  stage: the ask, what the agent does said in words, the screen building
  beside it), what's inside (the kit, the Studio, the bridge, the docs'
  families), what it plays well with (your styling, your agent, your
  models), a centred install closed by the kit's spec sheet, and the
  footer on the kit's own art (a star grain, a small spiral galaxy turning
  around the brand's diamond, and dithered light trails weaving through it
  and sweeping behind the name, the galaxy filling the gap between the
  links and the name; it dances by itself for under five seconds as it
  comes into view, then only while the reader moves the page): the brand (struck in
  as it nears, typewriter-wise) beside link columns, the copyright line,
  and the line-screen wordmark printed over the road's foot. It keeps the
  user's slop bans as lifted for it (User Preferences). No film
  player or animation runtime ships with the page. The trailer
  (`public/trailer/`: H.264 MP4, VP9 WebM, a poster) plays behind the
  hero's "Watch the film" key and is fetched only when its dialog opens.
  Details in `src/pages/AGENTS.md`.
- Page transitions: moving between the site's pages is a cross-document
  view transition the arriving page dithers through the kit's transition
  engine (`dither-kit/engine/transition.ts`, a band of the signal ink on
  the wipe's front); an inline head script from `src/app/page-reveal.ts`
  (set in every site page's head by the shell,
  `solid-site/src/entry-server.tsx`) catches it before the app runs. The theme
  turns through the same engine as an iris. Details in `src/AGENTS.md`.
- Crawler surface: `src/pages/docs/crawler-files.ts` generates
  `sitemap.xml`, `robots.txt` and `llms.txt` at build (the `siteFiles`
  plugin, `solid-site/site-files.ts`, emitted with the browser's assets and
  served in dev; no hand-maintained copies in `public/`). It derives every
  URL from `SITE_URL` + `GROUPS` (a dead section id fails the build),
  declares an explicit allow-all AI-crawler posture, and ships a curated
  llmstxt.org index. Guarded by `tests/crawler-files.spec.ts`.
- SEO engine: the post-build (`solid-site/scripts/postbuild.mjs`, its
  drawing code `scripts/cards.ts`) draws a 1200x630 SHARE CARD per page
  the site shares (`home`, `docs`, `studio` and every docs section) as
  `og/<id>.png` (its still: the og/X image every link preview shows) and
  `og/<id>.gif` (the same card looping, 5.76s: the kit's diamond swells
  over its print and back), on a few pages of the card renderer at once,
  itself a page of the build (`og/index.html`, built by
  `solid-site/scripts/og-page.ts` from `og-shell.html` and
  `src/pages/docs/og-page.ts`, `window.og.files(id)`): set as the
  landing's hero (the brand, the title in chrome, its line, a satin key
  and the address) beside a print of the kit's own poster on its dithered
  floor (`og-art.ts` runs the kit's poster engine; home prints the hero's
  composition; the card's design in `og-card.ts`, the encoder
  `src/shared/lib/gif.ts`). Each docs section is a prerendered page of its
  own, `docs/<id>/index.html` (the route `solid-site/src/routes/docs/[section].tsx`;
  its head from the one head table, `solid-site/src/pages/docs/heads.ts`:
  title/description/canonical/og/twitter, the card's tags, BreadcrumbList,
  the meta derived ONLY from `seo.ts`'s `docsMeta`/`docsBreadcrumb`; body:
  the docs shell with only that section in the flow, never a copy of the
  whole docs). A static host serves it at `/docs/<id>/`, which the docs
  deep link accepts. Where an app plays images, the card plays: every
  page's head links Discord's component embed `embed/<id>.json` (title, a
  line, the playing GIF, link buttons; Discord shows it in place of the og
  preview, the og tags its fallback; a section's line is its own lede,
  read off its built page by the post-build) and an oEmbed photo
  `oembed/<id>.json` of the GIF (Slack reads oEmbed first), both emitted
  by the `siteFiles` plugin. The og:image stays the PNG: WhatsApp and
  Telegram do not take a GIF. robots disallows only the renderer
  (`/og/$`, `/og/index.html`, `/og/sections.json`): X's bot obeys it and
  fetches the cards.
- Agent surface: the Studio is agent-addressable (see `src/AGENTS.md`,
  `features/agent`): `public/agent/SKILL.md` teaches any harness (Claude
  Code, Codex, pi, omp, sitegeist-bridged browsers) to compose Studio
  documents; the post-build writes `agent/registry.json` from the mounted
  studio; a live tab answers `dither-studio:command` DOM events and exposes
  `window.ditherStudio`. The in-app Agent panel is a CONTROL PLANE for the
  harness the user already has, nothing more: the local bridge
  (`bridge/dither-bridge.mjs`, see `bridge/AGENTS.md`; the build serves
  the same file at `bridge/dither-bridge.mjs`, which the panel's setup
  line fetches when no bridge answers) knows the common ACP
  harnesses (Claude Code, Codex, Gemini CLI, Qwen Code, oh-my-pi, Goose,
  OpenCode, Auggie) plus any command, says which are on the PATH, and
  starts the one picked in the panel as the user's OWN signed-in process.
  A harness reaches the canvas through ONE tool, `dither` (the user's
  call: one small definition, not every action's schema on every turn):
  `find` answers with the actions that fit the job and the kit components
  that do, `run` runs one, and when none fits well `build` makes a new one
  in JavaScript that is kept and found first next time. A built tool runs
  in a sandbox (an opaque-origin frame with no network, a worker it can
  be killed in, the Studio's actions its only way out) and only when the
  user approves that run; Auto never answers it.
  No key, model setting or login is ever collected in-app: the panel
  shows who answers and the model the harness reports, and switching
  model asks the harness among its own.
  `npm run demo:agent` (`scripts/agent-demo.mjs`) records the panel
  driving the user's own harness (Claude Code by default) into a video,
  run where that harness is signed in; never with borrowed credentials.
- Video: every Studio frame exports as a HyperFrames composition
  (`features/export-video`, the `video` selection action, the
  `video.export` command / `export_video` tool) — one self-contained HTML
  file that `npx hyperframes render` turns into a deterministic MP4. The
  kit's clock (`dither-kit/engine/clock.ts`) makes every animation seekable; the
  player page `/play/` (`solid-site/src/pages/play`) renders one frame and
  is also built as a single file (`play/player.js` and `player.css`, by
  `solid-site/standalone.ts`) that the export inlines. A reel (the `reel` widget kind, `reel.add` /
  `add_reel`, the `reel` selection action) plays other frames in order with
  ordered-dither transitions (`dither-kit/engine/wipe.ts` masks, `DitherReveal`)
  and exports as one MP4 as long as its cut. A reel whose clips carry
  camera keys, callouts and chapters is a film (`/studio#new/film` builds
  the kit's own, `reel.add` takes them from any agent), with a soundtrack
  the kit synthesizes from the cut (`dither-kit/engine/score.ts`: a chord per
  clip, the Bayer motif, a riser and an impact on every cut) that the
  export carries as the composition's audio track. Details in
  `src/AGENTS.md` and `dither-kit/AGENTS.md`.
- Styling systems: the kit is one kit in layers: `dither-kit/engine/`
  (framework-free, styling-free logic), `dither-kit/solid/` (the
  components, authored in SolidJS with Tailwind), `dither-kit/tailwind/`
  (the Tailwind layer's framework-free modules, `lib.ts` and `control.ts`,
  and the standalone stylesheet's entry `kit.css`) and
  `dither-kit/solid-stylex/` (the same components in StyleX, GENERATED
  from the Solid layer by `src/shared/lib/stylex-layer-solid.ts`; after
  editing a Solid kit file, `npx rs test -u tests/stylex-layer-solid.spec.ts`
  rewrites its StyleX twin, and the spec fails on any drift). The tokens
  live in `dither-kit/engine/theme.css` (plain custom properties the
  site's `src/app/styles.css` imports under Tailwind); the post-build (and
  `npm run build:css`, `scripts/kit-css.mjs`, alone) compiles
  `dither-kit/tailwind/kit.css` (tokens, the `.dither-kit`-scoped base,
  every utility the kit uses) into `kit/dither-kit.css` in the build, so
  apps on UnoCSS, vanilla CSS or CSS-in-JS run the Solid layer without
  Tailwind; StyleX apps alias `@dither-kit` to the StyleX layer;
  `dither-kit/engine/theme.ts` themes from JS. Details in
  `dither-kit/AGENTS.md`. What the site writes for a reader is Solid (the
  docs' tables, prose and snippets, the Studio's code export and
  `code.get`) and comes in
  their styling system too: `src/shared/lib/restyle-rewrite.ts` rewrites a
  Tailwind-classed snippet into a scoped stylesheet, CSS Modules or StyleX
  from the declarations Tailwind's compiler gives each class
  (`virtual-dither-utilities`, compiled at build from the docs + entities
  vocabulary by `src/shared/lib/utility-map.ts`); the docs' styling
  switch, the Studio's export dialog and `code.get { styling }` all go
  through it, and the docs' Run plays a Solid example in the page (see
  `src/widgets/source/AGENTS.md`).
- Print screens: every kit surface thresholds its density through a 4x4
  matrix, the Bayer one unless a `DitherScreen` around it picks a
  printer's screen (`line`, `diagonal`, `dot`, `cross`; `SCREENS` in
  `dither-kit/engine/pixel.ts`): each surface reads it through one
  function, `useDitherMatrix` (charts through their context's
  `matrixOf`), seeded as ever; a fill that carries a label keeps Bayer.
  `DitherPoster` prints the palette as tone through them: tiles that
  dissolve into each other and the kit's diamond as their negative. Docs: Utils (`print-screens`), Backgrounds (`poster`). Details in
  `dither-kit/AGENTS.md`.
- Browsers and drivers: the kit is web platform only — Chromium (Chrome,
  Edge, Brave), WebKit (Safari) and Gecko (Firefox) at Tailwind v4's floor
  (Chrome 111, Safari 16.4, Firefox 128); every newer API is feature-detected
  (`requestIdleCallback`, `startViewTransition`, WebGL2 → WebGL1,
  `ResizeObserver`/`IntersectionObserver` guards, `copyText`'s clipboard
  fallback) and the rest degrades (`text-wrap`, `content-visibility`,
  `scrollbar-*`). iOS (every browser there is WebKit) is a first-class
  target for the whole site, iPhone and iPad: fingers drag every control
  (`touch-action` set, `pointercancel` handled), the Studio canvas pans
  under a finger and pinches under two, and every right-click menu opens on
  a long press (`src/shared/lib/long-press.ts`); fields read at 16px there
  so focusing one never zooms the page (pinch zoom stays the reader's);
  full-height layouts are `dvh`; audio opens in the tap that asks for it;
  `theme-color` is each page's ground, in the theme the reader picked
  (`useTheme` tints it as the theme turns). The Studio's editor needs a 1024px
  width (iPad landscape); narrower screens get its notice. Details in
  `src/AGENTS.md` and `dither-kit/AGENTS.md`. Automation is plain DOM: the player answers the `hf-seek`
  event and `window.ditherClock`, the Studio `window.ditherStudio` (with
  `.clock`), the `dither-studio:command` event and `clock.seek`, so CDP,
  WebDriver and Playwright drive it in any engine; `npm run frames` renders
  a composition to PNGs/MP4 in Chromium, WebKit or Firefox without CDP.
- Motion in container units: `dither-kit/engine/keyframes.ts` (lengths as unit
  terms, interpolated with their units kept, resolved to px against a box)
  drives `DitherStage` (a size query container with one kit-clock) and
  `DitherLayer` (keyframes per layer: canvas, SVG or DOM), so a scene
  scales exactly with its parent and exports to video. Docs under
  Animations (`stage`); registry rows with composed demos.
- 3D + GLSL: the kit renders model files and fragment shaders through the
  same Bayer raster. `DitherWorld` (`dither-kit/engine/world.ts` engine,
  `models.ts` parsers, `world-gl.ts` GPU engine) loads VRML97 / VRML 1.0
  `.wrl`, X3D, glTF / GLB, OBJ + MTL, STL, PLY and OFF by URL or inline,
  and Gaussian splat captures (`.splat`, a trained capture's `.ply`;
  `engine/splats.ts`),
  plays the file's animations (VRML ROUTEs, glTF) on the kit clock, and
  rasterizes on the CPU (byte-exact, video-safe) or through WebGL for big
  meshes — both into one shared dither pass that also runs the palette
  ramp, fbm grain and bloom engines. `DitherShader` (`shader.ts`, `gl.ts`)
  compiles Shadertoy-style or raw GLSL in an offscreen WebGL context at the
  cell resolution and dithers the readback (1-bit, mono or a palette ramp);
  `iTime` is the kit clock. Surfaces form a render graph: any kit surface
  is a `DitherSurface` (`pull(ms)` paints a directed moment on demand), a
  shader binds surfaces as `iChannel0..3`, and a world takes a GLSL
  `shader` material over its finished target — the chain seeks as one.
  Textures ride the same graph: a world's `channels` skin the model through
  the file's texture coordinates (OBJ `vt`, glTF `TEXCOORD_0`, VRML
  `TextureCoordinate`, PLY `s`/`t`, the primitives' own) on either engine,
  and a material samples them with `dk_texture(p)` / `dk_uv(p)`.
  Any model is also a build (`engine/assemble.ts`): it comes apart along
  its own seams, rises from a dotted wire cage with each piece landing hot,
  scatters and leans from the pointer (`DitherWorld`'s `build`, `scatter`,
  `heat`, `nudge`); the landing's `#build` raises the brand's own lockup
  that way, cell by cell, as the page scrolls.
  Both are docs sections under Media (`world`, `shader`) and
  `COMPONENT_REGISTRY` rows. HyperFrames' renderer keeps WebGL2
  (SwiftShader), so GPU and shader frames export to MP4 too.
- Mascot: the brand's diamond come alive, our own (the user's call:
  never another product's character or a cartoon's), one cell table in
  `src/shared/ui/mascot.ts` drawn wherever it stands: by the wordmark in
  the site header, the Studio's empty states and the bridge card, and
  its tour of the Studio, where its antennae fold into a rotor and it
  flies from part to part explaining each, and its car on the footer's
  road (our own wedge speedster, never a real maker's car). Details in `src/AGENTS.md`
  and `src/pages/AGENTS.md`.
- PWA: the Studio installs as an app and opens offline; the landing and
  the docs stay pages of the web (the user's call). The build draws the
  app's manifest (`studio/app.webmanifest`, every URL relative so any base
  installs) and every icon (the site's `favicon.svg`/`.png` and
  `apple-touch-icon.png`, the app's `icons/` plain and maskable) from the
  brand mark's cells (`src/app/install-files.ts`, emitted by the
  `siteFiles` plugin; none kept in `public/`), and each page's head reads
  that module's tables: the icons on every site page (`ICON_HEAD`, the
  shell), the manifest and iOS's app tags on the Studio only (`APP_HEAD`,
  its route). A service worker (`src/app/sw.ts`, built alone to `sw.js` by
  `solid-site/standalone.ts`; its rules in `src/app/offline.ts`, the app's
  path one constant there) is registered by the Studio only, scoped to it:
  it keeps the Studio's page and its assets at install, serves pages
  network first (offline: the page as last seen, else the Studio's),
  hashed assets from the cache, and leaves the film, the cards and the
  player to the network. Details in `src/AGENTS.md`; guarded by
  `tests/install.spec.ts` and `solid-site/tests/site/worker-player.spec.tsx`.
- Discord integration: `discord/service.mjs` (Components V2) — the
  `/interactions` webhook (Ed25519; the dashboard key is a RAW 32-byte
  point — wrap it in the SPKI prefix; verify with `verify(null, …)`, node
  rejects a named digest for ed25519) answers `/component <section>` with a
  Container embed (text + the section's share card, playing, +
  Re-roll/Night-Day/Open-docs buttons) and updates the message in place on
  button clicks. Stateless (`dith:<id>:<seed>:<inv>` custom ids); re-rolled
  cards are drawn on demand as GIFs by `window.og.files` over the
  built site's `og/index.html` in playwright (see `discord/README.md`). A plain link
  to the site needs no bot: its component embed does that.

## Workflow Rules

- Verification gate before any commit, the full set CI runs (a remembered
  subset ships red): at the root on Node 22, `npm run lint`,
  `npx rs fmt --check` and `npm test`;
  in `solid-site/` on Node 24, `npm run check`, `npm test`,
  `npm run build` (which needs Chromium) and `npm test` again over the
  built site. Visual/stateful changes are also checked in a live browser
  (`npm run dev` or `npm run preview` in `solid-site/` + screenshots).
  Format what you touch with `rs fmt <paths>`.
- CI (`.github/workflows/ci.yml`) is two jobs: `root` (lint, format and
  the framework-free specs) and `site` (`solid-site/`: types for the whole
  repository, the component specs, the static build, the specs again over
  the built site).
- The site's build prerenders every page so non-JS crawlers read the real
  page DOM from bytes, and its post-build draws in headless Chromium
  (`CHROME_PATH` or standard install paths, preinstalled on GitHub Actions
  ubuntu runners); the script fails loudly rather than skipping. Do not
  hand-edit `solid-site/.output/` — regenerate via the build.
- Multiple agents may work this tree concurrently. Stage and commit only the
  files you changed; never revert another agent's uncommitted work — if it
  blocks the build, save a patch first and coordinate.
- Commit at the end of every completed task; concise message naming the seam.
- Fix root causes, not symptoms; no TODOs, stubs, or placeholder logic.
- `.rpiv/` contains private local research/workflow artifacts: keep it ignored,
  excluded from container contexts, and out of public commits.

## User Preferences

- The look is written down in one readable place, `DESIGN.md` (identity,
  palette, materials, type, layout, shape, motion, the dither, icons,
  copy, bans, accessibility, performance), its values pinned to their
  source by `tests/design-doc.spec.ts`; a design call changes the source
  and `DESIGN.md` in the same commit. The rules below stay binding.
- Design direction: dark, monospace, pixel/dither identity, worn as the
  user's look: Y2K retrofuturism, biomorphic form and technical
  sportswear (chrome display type, hardshell panels with cut corners
  holding recessed gel wells, a satin chrome primary key, machined
  secondary keys and segment tracks, smoked-polymer overlays, spec labels
  and slanted speed tags), worn by the docs and the Studio; the landing
  is printed in the dark, always (the user's calls): obsidian (`#101214`)
  with one bone ink (`#E4E1D8`) and a fine grain, no frame or side lines
  (the user's call), colour only in the kit's own
  art; the reference's taste, never its devices (the user's call: a
  borrowing must not read as a copy, so no banded poster with a hatched
  disc, no striped band over the footer, no numbered hairline grid, no
  capitals for labels; our art is the kit's Bayer tone); it keeps the chrome
  display type and the chrome primary key in their dark finish, and
  sheds what the slop bans below still name. Its materials are the
  site voice's (`src/app/styles.css`, both
  themes; see `src/AGENTS.md`), the pages' uses in
  `src/pages/AGENTS.md`. The user's reference is their "Y2K / Biomorphic
  Retrofuturism" design system (V5, a private kit, not in the repo); its
  rules for this site: the palette obsidian `#101214`, graphite
  `#25292D`, titanium `#A6ABB1`, chrome `#D4DCE1`, bone `#E4E1D8` with ONE
  signal accent (the kit's ember); one structural material per surface
  (anodized graphite, bone ceramic, titanium edges, smoked polymer), no
  iridescent pearl, no frosted glassmorphism, no arbitrary glow, no neon;
  metal finishes on display type and the primary key only, never on body
  text or every heading; soft shells against a few sharp machined
  boundaries, never uniform pills; motion is one glide on everything (the
  user's call): one curve that leaves at full speed and settles long and
  soft, never past its mark (the kit's `GLIDE_BEZIER`, its "glide"
  easing, the site's `--ease-settle`) eases every transition and every
  driven wipe, reveal, rise and page transition alike, 150ms for a colour
  (the industrial brief's micro feedback), 350ms for a hand's movement,
  500ms for a sheet; one moving layer at a
  time against a still ground (the user's call after the still ground
  study). Alignment matters (the user's call): what stands under the
  header stands on its lines (a sheet's words start on the brand mark's
  edge and end on the key word's), and nothing a finger touched is left
  out of line (a hover moves only where a pointer hovers). Display type wears
  its suggested extended face, Michroma (SIL OFL, self-hosted in
  `src/shared/fonts/`): the landing's statement and section titles, the
  docs' page title and section titles (plain ink; chrome only on the hero statement). Its squared heading sans is not used; headings, body,
  labels, figures and code stay mono, the user's identity, save one
  lift (the user's call after the composer board): the Studio agent
  panel's thread prose (replies, messages, thoughts) reads in the
  proportional face, its code, steps and chrome staying mono.
- Industrial futurism (the user's brief, "Sculptural Industrial
  Futurism"; its product references stay unnamed): engineered, never
  decorated. Its default variant is Precision / Wire (slender spans, one
  distinctive junction, selective absence) over the sculptural and the
  aerodynamic; silhouette first; a detail only where it reads as
  construction (one credible joint a surface, the hardshell's cut; never
  fasteners, labels or cut corners as filler); honest materials (satin
  before mirror chrome, two materials and one accent); one accent family
  (ours: the ember), the rest neutrals; motion like a mechanism (decisive
  travel, soft settle, no perpetual loops or scanning lines: the
  landing's art moves on cue, as it comes into view, then under the
  reader's hand, `solid-site/src/pages/landing/drive.ts`); never cyberpunk neon, a
  HUD dashboard or a retro filter. Where it differed from earlier calls,
  the user chose the brief, carefully: chrome only on the hero statement
  and the primary key (section titles and the docs' title in plain ink),
  150ms micro feedback, one shaped hardshell a page (the rest
  `.flat-shell`), the landing's bans and the mono identity kept.
- Design slop the user bans (their list; the landing is held to it, the
  docs and the Studio keep their tool chrome until the user extends it;
  for the printed landing the user lifted one: more than two inks inside
  the kit's art, the poster among it):
  tags (no `.spec` labels, speed tags or badges), italic or slanted type,
  a trendy serif display or negative tracking, over-detailed UI (call
  times, arguments, rulers, selection handles, decorative dot grids),
  dividers and hairlines, more than two inks on two grounds or alpha-tinted
  fills, containers with borders (a card or panel is a filled ground, a
  key a filled shape, the pressed segment filled), diagrams (the more
  detailed, the worse), code breadcrumbs (file paths, tool names or a
  command as a label; a command the reader copies is content), and
  numbered sections. A kit component's own look inside a demo is the
  product and stays.
- Codebase slop the user bans (their list), held in every change:
  implicit coupling (modules agreeing through a string, a global or a call
  order instead of a shared constant or type), layer-first folders (a
  feature scattered across `components/`, `utils/`, `types/`),
  duplication (one rule written twice drifts: extract it, or generate the
  copy and pin it with a test), representable illegal states (a union, not
  flags or parallel fields that must agree), god files, shotgun surgery
  (one change touching many files: one table drives the rest), layering
  violations (imports flow down, never sideways into another slice, up or
  in a cycle), pass-through wrappers, and errors or validation away from
  the boundary (untrusted input parsed once where it enters, into a type
  nothing past it re-checks). A fix comes with the test that would have
  caught it.
- One site voice: the landing, the docs and the Studio speak one language
  (dark theme tokens, monospace, hairlines, ringed pressed states), so the
  whole site reads as one product. The copy follows the design.how bans
  the user picked (design.how's `build-design-system` taste file, reviews
  by its `ui-review` criteria): no uppercase labels, no eyebrow over a
  title, no middle dots or em dashes, no link ending in an arrow. The
  landing, the docs and the Studio all follow them: headings, buttons and
  actions in sentence case; field labels and option values may keep the
  lowercase tool voice, never uppercase (uppercase and tracking belong
  only to spec labels and speed tags, the user's lift for the new look);
  a kit component's own designed
  look (its default strings, its label styles) is the product and stays.
  No space on a page is left empty. Icons do the
  work of labels where they can, with attention to detail: kit glyphs
  (`DitherIcon`) for ideas, and the REAL marks of the tools themselves
  (npm, pnpm, Bun, Node, Solid, Tailwind, StyleX, CSS Modules, CSS,
  GitHub, each coding agent) from
  `src/shared/ui/marks.ts`, one-colour beside their names, never
  restyled. Under its own hero the landing keeps the page layout the
  user picked from a reference (sections in the order and anatomy
  `src/pages/AGENTS.md` sets), never a reference's hero, and the dither
  winners on Awwwards lend the SCALE (full-bleed art, display-size type);
  the page is filled with the kit itself and our own copy, never a
  reference site's assets, marks, names or words. Reference sites stay
  UNNAMED in everything that ships or is public: code, docs, commit
  messages and pull requests (the user's call); describe the layout
  itself instead. The user
  lifted chrome and gloss, cut corners, and caps and slants for spec
  labels for the new look; still rejected: red, the
  nodecode grid (details in `src/pages/AGENTS.md`).
- Docs follow shadcn-style anatomy (sidebar rail, Preview/Code tabs, API
  tables, variant galleries) while keeping the dither skin; every preview
  carries Kobra's workbench and more (Inspect: the inspect and annotate
  tool tray, captures, comments copied for an agent — see
  `src/widgets/workbench/AGENTS.md`) and its Code tab is Kobra's source
  panel (the example, the kit files behind it, the tokens and a
  `prompt.md` as tabs; edit, Run in the page, download as a zip — see
  `src/widgets/source/AGENTS.md`); Kobra's interface sounds play on the
  docs, switched off from the header. Docs previews are real product
  surfaces: build real, working tools on them, never mock-ups.
- The Studio is laid out as an app window, chat first (the user's call,
  after an agent app's desktop window and its PWA): a title bar, a
  sidebar of projects and their chats (search on ⌘K, row menus, chats
  by day), the chat as a column, the canvas beside it, properties and
  layers docked right; a chat with no bridge shows the one line that
  starts it and finds the bridge once it runs. Only the layout and the
  behaviour were taken: the Studio keeps the look's materials and its
  mono type (details in `src/pages/AGENTS.md`).
- The Studio is a PWA (the user's call; the landing and the docs need not
  be): installable on every platform it targets, iOS included, and usable
  offline; a change to the Studio's page, its assets or a large media
  path keeps the worker's rules (`src/app/offline.ts`) and the install
  surface in step.
- Prefer editing existing code over adding new files; avoid over-abstraction and
  new dependencies. Net-negative LOC is prized when behavior remains complete.
- Accessibility is a floor, not a feature: labels, focus rings, reduced-motion
  and reduced-transparency support are expected in every change, and the
  user's design system asks it too: text at AA (4.5:1) on the rendered
  page, gradients and materials included, and 24px targets (WCAG 2.5.8).
  One focus colour everywhere (the kit, the site): a
  control that draws its own indicator draws it in the theme's ring ink
  (`ring-ring`, a field's `border-ring`), never a tinted accent or a faded
  foreground, which vanish on some ground; `tests/focus-ring.spec.ts`
  scans both, utilities and stylesheet `:focus` rules alike.
- Studio serves Solid developers and visual designers equally. Use the durable
  audience, interaction, and aesthetic contract in `.impeccable.md` for UI work.

## Child DOX Index

- `bridge/AGENTS.md` — the local ACP bridge: zero-dep relay between a
  Studio tab and the user's own coding agent, Studio tools as an MCP server
- `dither-kit/AGENTS.md` — the toolkit: dither engine, palette, component
  contracts, portability rules, the Solid layer and its generated StyleX
  twin
- `solid-site/AGENTS.md` — the site's SolidStart package: routes, the
  shell, aliases, the build's plugins and post-build, Solid conventions,
  the component and site specs
- `src/AGENTS.md` — the app's contracts for both halves of its source
  (`src/`, the framework-free modules; `solid-site/src/`, the components
  at the same paths): FSD layers, routing, editor/history/persistence
  contracts, a11y floor
  - `src/pages/AGENTS.md` — landing/docs/studio page conventions
  - `src/widgets/workbench/AGENTS.md` — the docs previews' workbench
  - `src/widgets/source/AGENTS.md` — the docs previews' source files and
    Run
