# widgets/source — the docs previews' source files and Run

## Purpose

Kobra's source panel for every docs preview: what the preview is made of,
as files a reader reads, edits, copies, downloads and runs in the page —
a real tool, never a mock.

## Ownership

- `SourcePanel.vue` — the panel: file tabs, the toolbar (Revert, Copy,
  Download all as a zip, Run), the editor, Run's problems, a status line.
- `Editor.vue` — a textarea with a line gutter (native undo, IME, screen
  readers); Tab / Shift+Tab indent the selected lines, Escape hands the
  next Tab back to the page (never a keyboard trap), Enter keeps the
  indent, ⌘/Ctrl+Enter runs; the gutter follows the textarea's scroll.
- `RunView.vue` — a run's component inside an error boundary: what it
  throws shows in the preview, not as a broken page.
- `model/files.ts` — pure: the kit index as export → file, a snippet's kind,
  a fragment completed into an SFC (`asSfc`), the kit files an example
  imports per framework, file names, `prompt.md`.
- `model/compile.ts` — pure: Vue's compiler-sfc (browser build) for SFCs;
  TypeScript removed by cutting its type syntax (enums, namespaces and
  parameter properties are refused with their place — they need a
  transpiler); imports/exports linked into a function body evaluated with
  the page's modules; scoped styles, CSS Modules (`$style` names renamed),
  tokens scoped to one preview (`scopeTokens`).
- `model/run.ts` — the linker: the page's Vue (an explicit API list, not a
  namespace — a namespace import keeps all of Vue in every page's chunk),
  the kit's packages (`PACKAGES`), `@stylexjs/stylex`, and the kit.
- `model/stylex.ts` — StyleX at run time, standing in for its bundler
  plugin: `create`, `attrs` (Vue), `props`, `defineVars`, `keyframes`,
  `firstThatWorks`. Every property and condition becomes one atomic class
  (`x` + a hash of its rule) written once into `style[data-run-stylex]` in
  the head (`plain`, then `conditional`: pseudo-classes and then the
  pseudo-element join the selector, at-rules wrap it); a pseudo-element is
  a top-level key holding its own properties, as StyleX writes it
  (`"::before": { content }`); the last style to set a property wins;
  numbers are px except the unitless properties. The kit's StyleX layer
  runs on it in the tests (`tests/components/stylex-layer.spec.ts`).

## Local Contracts

- Mounted by `pages/docs/DemoCard.vue` (lazy, on the Code tab's first open,
  then kept so edits survive the Preview tab) with the authored snippet,
  `docsCode` as `translate`, the framework, the styling system and the
  card's `SourceContext` (section, place, title, line, URL, install steps).
- Files: the example (`<Section>Example.vue|.svelte`, a fragment completed
  with its imports and template, in the reader's framework and styling
  system; non-component snippets keep their language: `.sh`, `.ts`,
  `.css`), the kit's own source for each kit export it imports, the kit's
  tokens (`engine/theme.css`) and `prompt.md`. Kit files are the repo's,
  served by the build at `kit/src/<vue|svelte>/` with a recursive
  `files.json` listing (`kitSources` in `rstack.config.ts`) — never a copy
  kept by hand. The reader's styling system picks the Vue kit's layer
  (`layerOf`: StyleX takes `stylex/`, every other system `tailwind/`);
  `kitEntry` names the public entry of a kit and layer, `kitIndex` maps its
  exports to files relative to it, and `resolveKitFile` resolves a kit
  import against its importer's folder, across layers. So on StyleX the
  tabs, the zip and `prompt.md` (`installFor`: the StyleX layer's install
  steps) are the StyleX layer's. Zip paths mirror the install: the example and
  prompt at the root, kit files under `dither-kit/` (`dither-kit-svelte/`)
  in their layer folders.
- Edits are kept per file (the example's per framework and styling
  system); a tab marks an edited file; Revert restores the original.
- Run (Vue, in any styling system: Tailwind, CSS, CSS Modules, and StyleX
  through `model/stylex.ts`; Svelte says why not):
  an example that edits only itself links to the page's kit (the very
  modules the docs run on). Once a kit file is edited, or on StyleX (the
  page carries only the Tailwind layer; `fromSource`), the example links to
  a kit evaluated from its source — the edits and every kit file the run
  reaches — so a compound component and its contexts (chart, series,
  field, drawer) share one set of modules. Problems come back located
  (`file line:col`, a click opens the file at the place); the last good run
  stays up. The result replaces the demo in the preview (shown above the
  source while it runs) until "Restore the demo"; its CSS lives in one
  `<style>` per card; edited tokens apply to that preview only.
- New kit imports from `vue` or a package must be linkable: the spec holds
  `VUE`/`PACKAGES` to every name the kit and its compiled templates import.
- Sounds (`shared/lib/sound.ts`): tab and toolbar taps, copy.

## Verification

- `tests/source.spec.ts` (run against compiler-sfc's browser build, the one
  Run ships: `define.test` aliases it, since the node target would take the
  CJS build and its uninstalled template engines): the kit index, snippet kinds, `asSfc`, kit files
  per framework, names and the prompt; TypeScript stripping and refusals,
  linking (re-exports, live bindings, missing exports), SFC styles and
  located errors, scoped tokens; every kit file compiles and links, and
  every name it imports is provided; the zip read back entry by entry
  (CRC-32 included); the sound cues and the mute; the StyleX runtime
  (atomic classes, last style wins, conditions after plain rules,
  variables, keyframes, fallbacks); a DemoCard opened to its files, an
  example edited and run, a kit file edited and run, a broken edit located,
  the demo restored, and the example run as StyleX (the StyleX layer's
  files in the tabs and the prompt, its elements and the kit component's
  carrying the runtime's classes, their rules in the head).
- Browser walk (`rs dev`): `/docs/switch` and `/docs/button` — tabs by
  keyboard, edit and Run, a kit file edited (`DitherSwitch.vue`), tokens
  edited (`theme.css`), CSS, CSS Modules and StyleX runs, the Svelte
  refusal, the zip (`unzip -t`), copy; `/docs/area` — the `…` sketch
  located, data filled in, `Area.vue` edited and the chart drawn; a 390px
  phone and light theme. On the built site, an example Run on Tailwind
  and on StyleX renders the same pixels (the two layers side by side).

## Child DOX Index

- none
