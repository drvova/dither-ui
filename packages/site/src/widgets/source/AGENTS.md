# widgets/source — the docs previews' source files and Run

## Purpose

Kobra's source panel for every docs preview: what the preview is made of,
as files a reader reads, edits, copies, downloads and runs in the page —
a real tool, never a mock.

## Ownership

The widget's components live in this folder and its model in `model/`,
the Solid-bound modules beside what is framework free (see
`../../AGENTS.md`).

- `SourcePanel.tsx` — the panel: file tabs (a row that scrolls; while more
  files sit past its right edge it fades there, so a phone shows the row
  goes on), the toolbar (Revert, Copy, Download all as a zip, Run, whose
  outline is the site's `--edge`), the editor, Run's problems, a status
  line. Its inks are the theme's full ink or muted ink, never a fade of
  either (the gutter's numbers and the keyboard hint included).
- `Editor.tsx` — a textarea with a line gutter (native undo, IME, screen
  readers); Tab / Shift+Tab indent the selected lines, Escape hands the
  next Tab back to the page (never a keyboard trap), Enter keeps the
  indent, ⌘/Ctrl+Enter runs; the gutter follows the textarea's scroll.
- `RunView.tsx` — a run's component inside an error boundary: what it
  throws shows in the preview, not as a broken page.
- `model/snippet.ts` — pure, framework free: a snippet's
  kind (`snippetKind`: a whole module, a fragment, `ts`, `css`, `sh`) and
  a Solid fragment completed into the whole `.tsx` module a reader takes
  (`asTsx`: the Solid APIs and kit exports it uses imported after what it
  imports itself is kept, its script the component's body, its markup what
  it returns, several nodes as one fragment). A fragment's script may stand
  over its markup or under it, as loose lines: either way it is the
  component's script, never text of its markup (the markup is read as JSX
  to its end). A stylesheet has no place in a fragment (it goes in a
  comment, or in a snippet of its own).
- `model/files.ts` — pure: what reads the kit's files: the kit index as export
  → file (`kitIndex`, `loadKitIndex`), `resolveKitFile`, the kit files an
  example imports (`kitFilesOf`), file names (`exampleName`), `prompt.md`
  (`promptFor`).
- `model/compile.ts` — pure but for one
  fetch: Solid's own compiler (`@babel/standalone` with
  `babel-preset-solid`, loaded on a reader's first Run: `compiler()`), a
  `.tsx` or TypeScript module compiled for a browser with its types
  removed, imports/exports linked into a function body evaluated with the
  page's modules (`evaluate`), CSS Modules (`cssModule`: classes renamed,
  the names a file reads mapped), tokens scoped to one preview
  (`scopeTokens`). What that compiler needs from the build is
  `build/run-compiler.ts`.
- `model/run.ts` — the linker: the page's
  own Solid (`solid-js`, `solid-js/store`, `solid-js/web`), the packages
  the kit's files import (`PACKAGES`), `@stylexjs/stylex`, and the kit.
- `model/stylex.ts` — StyleX at run time, standing in
  for its bundler plugin: `create`, `props`, `attrs`, `defineVars`,
  `keyframes`, `firstThatWorks`. Every property and condition becomes one
  atomic class (`x` + a hash of its rule) written once into
  `style[data-run-stylex]` in the head (`plain`, then `conditional`:
  pseudo-classes and then the pseudo-element join the selector, at-rules
  wrap it); a pseudo-element is a top-level key holding its own
  properties, as StyleX writes it (`"::before": { content }`); the last
  style to set a property wins; numbers are px except the unitless
  properties. The kit's StyleX layer runs on it in
  `tests/site/stylex-layer.spec.tsx`.

## Local Contracts

- Mounted by `pages/docs/DemoCard.tsx` (lazy, on the Code tab's first open,
  then kept so edits survive the Preview tab) with the snippet as written,
  `docsFiles` as `translate` (the snippet in the reader's styling system),
  the styling system and the
  card's `SourceContext` (section, place, title, line, URL, install steps).
- Files: the example (`<Section>Example.tsx`, a whole module or a
  fragment completed with its imports (what it imports already kept as
  written), in the reader's styling system;
  non-component snippets keep their language: `.sh`, `.ts`, `.css`), the
  stylesheet it imports on CSS or CSS Modules, the kit's own
  source for each kit export it imports, the kit's tokens
  (`engine/theme.css`) and `prompt.md`. Kit files are the repo's, served
  by the build under `KIT_SRC` (`kit/src/solid/`) with a recursive `files.json`
  listing (`kitSources`, `build/kit-sources.ts`; the path and which
  files count are one rule, `src/shared/lib/kit-sources.ts`) — never a copy kept by hand.
  The kit is served as its files import each other (`solid/`,
  `engine/`, `tailwind/`); `KIT_ENTRY` names its public entry,
  `kitIndex` maps its exports to files relative to it, and
  `resolveKitFile` resolves a kit import against its importer's folder,
  across those folders. Zip paths mirror the install: the example and
  prompt at the root, kit files under `dither-kit/`
  in their folders.
- Edits are kept per file (the example's per styling
  system); a tab marks an edited file; Revert restores the original.
- Run (in any styling system: Tailwind, CSS, CSS Modules, and
  StyleX through `model/stylex.ts`): an example that
  edits only itself links to the page's kit (the very modules the docs run
  on). Once a kit file is edited, or the example imports a kit file by its
  path, the example links to a kit evaluated from its source — the edits
  and every kit file the run reaches — so a compound component and its
  contexts (chart, series, field, drawer) share one set of modules.
  Problems come back located (`file line:col`, a click opens the file at
  the place); the last good run stays up. The result replaces the demo in
  the preview (shown above the source while it runs) until "Restore the
  demo"; its CSS lives in one `<style>` per card; edited tokens apply to
  that preview only.
- Every example runs as written: it declares every name it reads (its
  state, its handlers, its data, printed from the demo's own values by
  `dataCode` in `pages/docs/snippet.ts`), elides nothing, sizes the box a
  filling surface stands in, and asks only for files the site holds
  (`public/` or what the build writes beside the pages). What is not a
  component (a command, a module, a stylesheet) is told apart by
  `snippetKind`, the rule Run itself reads.
- A new kit import from a package must be linkable: the spec holds
  `PACKAGES` to every name the kit's files import.
- Sounds (`shared/lib/sound.ts`): tab and toolbar taps, copy.

## Verification

- `tests/source.spec.ts` (root, `rs test`): a snippet's kind, `asTsx`, the
  zip read back entry by entry (CRC-32 included), the StyleX runtime
  (atomic classes, last style wins, conditions after plain rules,
  variables, keyframes, fallbacks).
- `tests/site/source.spec.tsx` (Vitest): the kit's served
  sources, the kit index, a fragment completed into a Solid file, the kit
  files an example imports, names and the prompt; type syntax cut, JSX compiled
  against Solid's runtime and a syntax error located, linking (re-exports,
  live exports), scoped tokens, CSS Modules; every file of the Solid kit
  compiles and every name it imports from a package is provided; every
  docs snippet's Solid file compiles in every styling system, imports every
  kit component it renders, calls nothing of the site's own, and prints
  neither its script nor a note as text; every docs snippet is Solid,
  never Vue's notation; every
  card the docs render (read where it stands, its pickers at their first
  state) runs as written: TypeScript's checker finds no name it leaves
  unbound over the browser's globals (nor a window name it reads bare,
  `open` or `name`), no elision, no root-relative address the site does
  not hold; the reader's
  styling choice (and Solid for a reader who once stored another
  framework); a DemoCard opened to its files, an example
  edited and run and the demo restored, the example run as plain CSS, CSS
  Modules and StyleX, the
  tabs by keyboard and a revert.
- Browser walk (`npm run dev`): `/docs/switch` and
  `/docs/button` — tabs by keyboard, edit and Run, a kit file edited
  (`DitherSwitch.tsx`), tokens edited (`theme.css`), CSS, CSS Modules and
  StyleX runs, the zip (`unzip -t`), copy;
  `/docs/area` — `Area.tsx` edited and the chart drawn; a 390px phone and
  light theme. `npm run walk` Runs every example in every styling
  system and counts what stops.

## Child DOX Index

- none
