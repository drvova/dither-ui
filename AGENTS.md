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

- dither-ui: a dithered UI toolkit for Vue (dither-ui.com). Two halves:
  `dither-kit/` (the portable component library) and `src/` (site + studio).
- Stack: Vue 3, TypeScript strict, Tailwind v4, d3-scale/d3-shape, on the
  Rstack toolchain. No vue-router; Rstest covers models/components; no
  emojis in code.
- Toolchain: ONE CLI (`rs`, the `rstack` package) and ONE config,
  `rstack.config.ts`: `define.app` is Rsbuild (Rspack) — `rs dev`,
  `rs build`, `rs preview`; `define.test` is Rstest (`rs test`, inheriting
  the app's plugins and aliases); `define.lint` is Rslint (`rs lint`) for
  TS/JS; `define.fmt` is the formatter (`rs fmt`). Rslint has no Vue SFC
  parser, so `.vue` files stay on ESLint + eslint-plugin-vue
  (`eslint.config.js`, run by `npm run lint` after `rs lint`); type
  checking stays on `vue-tsc`. The config file loads under Node's own
  TypeScript, so a module it imports at runtime (`utility-map.ts`,
  `crawler-files.ts` and its graph: `groups.ts`, `seo.ts`, the `*-nav.ts`
  packs) writes relative imports WITH `.ts`. The web build also serves both
  kits' own source at `kit/src/<vue|svelte>/` with a `files.json` listing
  (`kitSources`) — what the docs' source panel shows, runs and zips.
  `benchmarks/` (the kit's raster benchmark) is an entry for `rs dev`
  only: `/benchmarks/` there, never in a build.
  `svelte-site/` runs the same CLI with its own `rstack.config.ts`.
- Aliases: `@` → `src/`; `@dither-kit` → the kit's Tailwind layer
  (`dither-kit/tailwind/index.ts`), `@dither-kit/<layer>/<file>` → a file
  of a layer (`engine/`, `tailwind/`, `stylex/`) (rstack.config.ts +
  tsconfig paths — change both together).
- Canonical routes: `/` landing · `/docs[/section]` · `/studio`; legacy hash
  routes remain supported for old links. GitHub Pages deploys through
  `.github/workflows/pages.yml`: `rs build` (the site and the player
  bundle), the kit stylesheet, `404.html` copied from the bare shell, then
  the prerender (snapshots, agent registry, share cards, section
  pages), so the live site paints from bytes and every sitemap URL is a
  real page. Default deploy base is `/` because `public/CNAME` sets
  `dither-ui.com`. Set repo variable `BASE_PATH=/dither-ui/` only when
  removing the custom domain and using the GitHub Pages project URL; that
  deploy skips the prerender (its server serves `dist` at `/`) and ships
  the shell.
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
  each place it stands: the hero, each plate, the footer); copy calm and procedural, every figure
  read from the kit), then
  sections under a title with a lead beside it, print plates of the brand
  small in a wide field between them (after the bento, after the
  ask, before the install): a bento of live
  components, one agent session played as the page scrolls (a pinned
  stage: the ask, what the agent does said in words, the screen building
  beside it), what's inside (the kit, the Studio, the bridge, the docs'
  families), a centred install closed by the kit's spec sheet, and the
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
  (added by `rstack.config.ts`) catches it before the app runs. The theme
  turns through the same engine as an iris. Details in `src/AGENTS.md`.
- Crawler surface: `src/pages/docs/crawler-files.ts` generates `dist/sitemap.xml`,
  `dist/robots.txt`, and `dist/llms.txt` at build (the `crawlFiles` plugin
  in `rstack.config.ts`, emitted as web-build assets —
  no hand-maintained copies in `public/`). It derives every URL from
  `SITE_URL` + `GROUPS` (a dead section id fails the build), declares an
  explicit allow-all AI-crawler posture, and ships a curated llmstxt.org
  index. Guarded by `tests/crawler-files.spec.ts`.
- SEO engine (in `scripts/prerender.mjs`, after the three routes): draws a
  1200x630 SHARE CARD per page the site shares (`home`, `docs`, `studio`
  and every docs section) as `dist/og/<id>.png` (its still: the og/X image
  every link preview shows) and `dist/og/<id>.gif` (the same card looping,
  3.6s), with four pages of the self-contained `ogCardPage()` renderer
  (`window.og.files(id)`; the art is `src/pages/docs/og-card.ts`, the
  encoder `src/shared/lib/gif.ts`, both carried inline as their source), and
  writes a per-section static page `dist/docs/<id>/index.html` (its head is
  the manifest's `head`: title/description/canonical/og/twitter, the card's
  tags, BreadcrumbList — meta derived ONLY from `seo.ts`'s
  `docsMeta`/`docsBreadcrumb`; body: the docs shell with only that section
  in the flow, ~160 kB, never a copy of the whole docs). A static host
  serves it at `/docs/<id>/`, which the docs deep link accepts. Where an
  app plays images, the card plays: every page's head (the route entries
  by hand, the sections from the manifest) links Discord's component embed
  `dist/embed/<id>.json` (title, a line, the playing GIF, link buttons;
  Discord shows it in place of the og preview, the og tags its fallback; a
  section's line is its own lede from the snapshot) and an oEmbed photo
  `dist/oembed/<id>.json` of the GIF (Slack reads oEmbed first), both
  emitted by the crawler plugin. The og:image stays the PNG: WhatsApp and
  Telegram do not take a GIF. robots disallows only the renderer
  (`/og/$`, `/og/index.html`, `/og/sections.json`): X's bot obeys it and
  fetches the cards.
- Agent surface: the Studio is agent-addressable (see `src/AGENTS.md`,
  `features/agent`): `public/agent/SKILL.md` teaches any harness (Claude
  Code, Codex, pi, omp, sitegeist-bridged browsers) to compose Studio
  documents; the build writes `dist/agent/registry.json` from the mounted
  studio; a live tab answers `dither-studio:command` DOM events and exposes
  `window.ditherStudio`. The in-app Agent panel is a CONTROL PLANE for the
  harness the user already has, nothing more: the local bridge
  (`bridge/dither-bridge.mjs`, see `bridge/AGENTS.md`) knows the common ACP
  harnesses (Claude Code, Codex, Gemini CLI, Qwen Code, oh-my-pi, Goose,
  OpenCode, Auggie) plus any command, says which are on the PATH, and
  starts the one picked in the panel as the user's OWN signed-in process.
  No key, model setting or login is ever collected in-app.
- Video: every Studio frame exports as a HyperFrames composition
  (`features/export-video`, the `video` selection action, the
  `video.export` command / `export_video` tool) — one self-contained HTML
  file that `npx hyperframes render` turns into a deterministic MP4. The
  kit's clock (`dither-kit/engine/clock.ts`) makes every animation seekable; the
  player page `/play/` (`src/pages/play`) renders one frame and is also
  built as a single file (the `player` environment of `rstack.config.ts` →
  `dist/play/player.js`)
  that the export inlines. A reel (the `reel` widget kind, `reel.add` /
  `add_reel`, the `reel` selection action) plays other frames in order with
  ordered-dither transitions (`dither-kit/engine/wipe.ts` masks, `DitherReveal`)
  and exports as one MP4 as long as its cut. A reel whose clips carry
  camera keys, callouts and chapters is a film (`/studio#new/film` builds
  the kit's own, `reel.add` takes them from any agent), with a soundtrack
  the kit synthesizes from the cut (`dither-kit/engine/score.ts`: a chord per
  clip, the Bayer motif, a riser and an impact on every cut) that the
  export carries as the composition's audio track. Details in
  `src/AGENTS.md` and `dither-kit/AGENTS.md`.
- Styling systems: the kit is one kit in styling layers: `dither-kit/engine/`
  (styling-free logic), `dither-kit/tailwind/` (the components, authored
  with Tailwind) and `dither-kit/stylex/` (the same components in StyleX,
  GENERATED from the Tailwind layer by `src/shared/lib/stylex-layer.ts`;
  after editing a Tailwind file, `npx rs test -u tests/stylex-layer.spec.ts`
  rewrites its StyleX twin, and the spec fails on any drift). The tokens
  live in `dither-kit/engine/theme.css` (plain custom properties the app's
  `src/app/styles.css` imports under Tailwind);
  `npm run build:css` (in `npm run build` and the Pages deploy) compiles
  `dither-kit/tailwind/kit.css` — tokens, the `.dither-kit`-scoped base, every
  utility the kit uses — into `dist/kit/dither-kit.css`, so apps on
  UnoCSS, vanilla CSS or CSS-in-JS run the Tailwind layer without Tailwind;
  StyleX apps alias `@dither-kit` to the StyleX layer;
  `dither-kit/engine/theme.ts` themes from JS. Details in `dither-kit/AGENTS.md`.
  What the site writes for a reader comes in their system too:
  `src/shared/lib/restyle.ts` rewrites a Tailwind-classed snippet into a
  scoped stylesheet, CSS Modules or StyleX from the declarations Tailwind's
  compiler gives each class (`virtual-dither-utilities`, compiled at build
  from the docs + entities vocabulary by `src/shared/lib/utility-map.ts`);
  the docs' styling switch, the Studio's export dialog and
  `code.get { styling }` all go through it, and the docs' Run plays the
  result in the page, StyleX included (on the kit's StyleX layer, which
  the source panel and the Quick start also show then; see
  `src/AGENTS.md`).
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
  Both are docs sections under Media (`world`, `shader`) and
  `COMPONENT_REGISTRY` rows. HyperFrames' renderer keeps WebGL2
  (SwiftShader), so GPU and shader frames export to MP4 too.
- Discord integration: `discord/service.mjs` (Components V2) — the
  `/interactions` webhook (Ed25519; the dashboard key is a RAW 32-byte
  point — wrap it in the SPKI prefix; verify with `verify(null, …)`, node
  rejects a named digest for ed25519) answers `/component <section>` with a
  Container embed (text + the section's share card, playing, +
  Re-roll/Night-Day/Open-docs buttons) and updates the message in place on
  button clicks. Stateless (`dith:<id>:<seed>:<inv>` custom ids); re-rolled
  cards are drawn on demand as GIFs by `window.og.files` over
  `dist/og/index.html` in playwright (see `discord/README.md`). A plain link
  to the site needs no bot: its component embed does that.

## Workflow Rules

- Verification gate before any commit: `npm run lint` (`rs lint` + ESLint
  on `.vue`), `npx rs fmt --check`, `npm run test` (`rs test`),
  `npx vue-tsc --noEmit` and `npx rs build` green — the full package.json
  verify set (CI runs it; a remembered subset ships red), plus
  `npm run check` in `dither-kit-svelte/` when the kit is touched;
  visual/stateful changes also checked in a live browser (`rs dev` or
  `rs preview` + screenshots). Format what you touch with `rs fmt <paths>`.
- `npm run build` type-checks, runs `rs build` (two Rsbuild environments in
  one run: `web`, the four route pages; `player`, the single-file player
  bundle in `dist/play/`), compiles the kit stylesheet, and
  ends with a headless-chromium prerender of `/`, `/docs`,
  and `/studio` (`scripts/prerender.mjs`, devDependency playwright-core) so
  non-JS crawlers read the real page DOM from bytes. It requires a chromium
  binary (`CHROME_PATH` or standard install paths — preinstalled on GitHub
  Actions ubuntu runners); the script fails loudly rather than skipping. Do
  not
  hand-edit `dist/*/index.html` output — regenerate via the build.
- Multiple agents may work this tree concurrently. Stage and commit only the
  files you changed; never revert another agent's uncommitted work — if it
  blocks the build, save a patch first and coordinate.
- Commit at the end of every completed task; concise message naming the seam.
- Fix root causes, not symptoms; no TODOs, stubs, or placeholder logic.
- `.rpiv/` contains private local research/workflow artifacts: keep it ignored,
  excluded from container contexts, and out of public commits.

## User Preferences

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
  boundaries, never uniform pills; motion 120-200ms micro, 240-400ms
  panels, settle easing `cubic-bezier(.22,1,.36,1)` for what a hand does
  (a press, a drag, a hover), while the kit's driven motion (wipes,
  reveals, the clock) runs at one steady speed; one moving layer at a
  time against a still ground (the user's call after the still ground
  study). Display type wears
  its suggested extended face, Michroma (SIL OFL, self-hosted in
  `src/shared/fonts/`): the landing's statement and section titles and the
  docs' page title. Its squared heading sans is not used; headings, body,
  labels, figures and code stay mono, the user's identity.
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
  (npm, pnpm, Bun, Node, Vue, Svelte, Tailwind, StyleX, CSS Modules, CSS,
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
- Prefer editing existing code over adding new files; avoid over-abstraction and
  new dependencies. Net-negative LOC is prized when behavior remains complete.
- Accessibility is a floor, not a feature: labels, focus rings, reduced-motion
  and reduced-transparency support are expected in every change, and the
  user's design system asks it too: text at AA (4.5:1) on the rendered
  page, gradients and materials included, and 24px targets (WCAG 2.5.8).
  One focus colour everywhere (the kit, its Svelte port, the site): a
  control that draws its own indicator draws it in the theme's ring ink
  (`ring-ring`, a field's `border-ring`), never a tinted accent or a faded
  foreground, which vanish on some ground; `tests/focus-ring.spec.ts`
  scans all three.
- Studio serves Vue developers and visual designers equally. Use the durable
  audience, interaction, and aesthetic contract in `.impeccable.md` for UI work.

## Child DOX Index

- `bridge/AGENTS.md` — the local ACP bridge: zero-dep relay between a
  Studio tab and the user's own coding agent, Studio tools as an MCP server
- `dither-kit/AGENTS.md` — the toolkit: dither engine, palette, component
  contracts, portability rules
- `dither-kit-svelte/AGENTS.md` — the Svelte 5 port of the toolkit: runes-only
  components, `ditherBackground` action runtime, verbatim engine copies,
  organized into engine/runtime/family subfolders
- `svelte-site/AGENTS.md` — the Svelte showcase app: landing page mirroring the
  Vue `src/` landing, built on `dither-kit-svelte`
- `src/AGENTS.md` — the app: FSD layers, routing, editor/history/persistence
  contracts, a11y floor
  - `src/pages/AGENTS.md` — landing/docs/studio page conventions
  - `src/widgets/workbench/AGENTS.md` — the docs previews' workbench
  - `src/widgets/source/AGENTS.md` — the docs previews' source files and
    Run