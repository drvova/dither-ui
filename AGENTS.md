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
- Stack: Vue 3, TypeScript strict, Vite, Tailwind v4, d3-scale/d3-shape.
  No vue-router; Vitest covers models/components; no emojis in code.
- Aliases: `@` → `src/`, `@dither-kit` → `dither-kit/` (vite.config.ts +
  tsconfig paths — change both together).
- Canonical routes: `/` landing · `/docs[/section]` · `/studio`; legacy hash
  routes remain supported for old links. GitHub Pages deploys through
  `.github/workflows/pages.yml` (`vite build` + the player bundle; the
  prerender is not part of the deploy); default deploy base is `/` because
  `public/CNAME` sets `dither-ui.com`. Set repo variable
  `VITE_BASE_PATH=/dither-ui/` only when removing the custom domain and using
  the GitHub Pages project URL.
- Assets: `public/faces.webp` is the measured portrait/emote band;
  `public/sprites.webp` is the broader character sheet. `public/emotes/`
  holds alpha-keyed per-sprite crops of that band (six faces + six emotes,
  measured coordinates in `LandingPage.vue` FACES) — regenerate from the
  sheet, don't hand-draw. They decorate the README; the landing still
  blits from the sheet directly.
- Crawler surface: `src/pages/docs/crawler-files.ts` generates `dist/sitemap.xml`,
  `dist/robots.txt`, and `dist/llms.txt` at build (vite `crawlFiles` plugin —
  no hand-maintained copies in `public/`). It derives every URL from
  `SITE_URL` + `GROUPS` (a dead section id fails the build), declares an
  explicit allow-all AI-crawler posture, and ships a curated llmstxt.org
  index. Guarded by `tests/crawler-files.spec.ts`.
- SEO engine (in `scripts/prerender.mjs`, after the three routes): renders a
  1200x630 og card per docs section (`dist/og/<id>.png`, from the
  self-contained `ogCardPage()` renderer + `sectionsManifest()`, cached by a
  manifest hash in `dist/og/.cards-hash`) and writes a per-section static
  page `dist/docs/<id>/index.html` (section head: title/description/
  canonical/og/twitter/BreadcrumbList — meta derived ONLY from
  `seo.ts`'s `docsMeta`/`docsBreadcrumb`). The og surface is Disallow'd in
  robots (assets, not pages).
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
  kit's clock (`dither-kit/clock.ts`) makes every animation seekable; the
  player page `/play/` (`src/pages/play`) renders one frame and is also
  built as a single file (`vite.player.config.ts` → `dist/play/player.js`)
  that the export inlines. Details in `src/AGENTS.md` and
  `dither-kit/AGENTS.md`.
- 3D + GLSL: the kit renders model files and fragment shaders through the
  same Bayer raster. `DitherWorld` (`dither-kit/world.ts` engine,
  `models.ts` parsers, `world-gl.ts` GPU engine) loads VRML97 / VRML 1.0
  `.wrl`, X3D, glTF / GLB, OBJ + MTL, STL, PLY and OFF by URL or inline,
  plays the file's animations (VRML ROUTEs, glTF) on the kit clock, and
  rasterizes on the CPU (byte-exact, video-safe) or through WebGL for big
  meshes — both into one shared dither pass that also runs the palette
  ramp, fbm grain and bloom engines. `DitherShader` (`shader.ts`, `gl.ts`)
  compiles Shadertoy-style or raw GLSL in an offscreen WebGL context at the
  cell resolution and dithers the readback (1-bit, mono or a palette ramp);
  `iTime` is the kit clock. Both are docs sections under Media (`world`,
  `shader`) and `COMPONENT_REGISTRY` rows. HyperFrames' renderer keeps
  WebGL2 (SwiftShader), so GPU and shader frames export to MP4 too.
- Discord integration: `discord/service.mjs` (Components V2) — the
  `/interactions` webhook (Ed25519; the dashboard key is a RAW 32-byte
  point — wrap it in the SPKI prefix; verify with `verify(null, …)`, node
  rejects a named digest for ed25519) answers `/component <section>` with a
  Container embed (text + the section's og card + Re-roll/Night-Day/Open-docs
  buttons) and updates the message in place on button clicks. Stateless
  (`dith:<id>:<seed>:<inv>` custom ids); re-rolled previews render on demand
  via playwright over `dist/og/index.html` (see `discord/README.md`).

## Workflow Rules

- Verification gate before any commit: `npm run lint`, `npm run test`,
  `npx vue-tsc --noEmit` and `npx vite build` green — the full package.json
  verify set (CI runs it; a remembered subset ships red), plus
  `npm run check` in `dither-kit-svelte/` when the kit is touched;
  visual/stateful changes also checked in a live browser (vite preview +
  screenshots).
- `npm run build` runs the site build, then the single-file player build
  (`vite build -c vite.player.config.ts`, also `npm run build:player`), and
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

- Design direction: dark, monospace, pixel/dither identity; Japanese-minimal
  restraint (one statement / one action / one visual) on the landing.
- Docs follow shadcn-style anatomy (sidebar rail, Preview/Code tabs, API
  tables, variant galleries) while keeping the dither skin.
- Prefer editing existing code over adding new files; avoid over-abstraction and
  new dependencies. Net-negative LOC is prized when behavior remains complete.
- Accessibility is a floor, not a feature: labels, focus rings, reduced-motion
  and reduced-transparency support are expected in every change.
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