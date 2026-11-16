# add

## Purpose

- `src/dither-add.mjs` is the add command: what a reader runs to put kit
  components into their project instead of copying the kit's folder by
  hand. It reads the site's manifest, writes each component asked for
  with every kit file it imports (the engine's included) into one folder
  of the project, in the styling system the project uses, with that
  folder's own index of just what was added, and says the one alias to
  set (`@dither-kit` to the copy's layer folder).

## Ownership

- Owns the command line (`add <component...>`, `list`, `diff
  [component...]`; `--styling tailwind|css|modules|stylex`, `--dir`,
  `--from <url|folder>`, `--dry-run`, `--force`), the project's settings
  file (`dither-kit.json` beside `package.json`, written once by the
  first add: `dir`, `styling`, `from` when not the site) and the copy's
  record (`<dir>/.dither-add.json`: the styling system, the manifest's
  version, the components added and each file's sha256 as written).
- Does not own the manifest or the files it reads: the site's build
  writes them (`packages/site/build/kit-add.ts`, `kitAdd`), derived from
  the kit, its StyleX twin and their import graph.

## Local Contracts

- Zero dependencies, one file, Node's built-ins only (`node:crypto`,
  `node:fs`, `node:path`, `fetch`); no build step. `package.json`
  declares none and depends on no package of this workspace
  (`tests/workspace.spec.ts` at the root); it exports the one file as
  `@dither-ui/add/dither-add.mjs`, which is how the site's build finds it.
- The site serves the file as written at `add/dither-add.mjs` (`ADD_FILE`
  in `packages/site/src/shared/lib/add-command.ts`), so it must keep
  running as a lone download, piped into Node:
  `curl -fsSL <site>add/dither-add.mjs | node --input-type=module - add
  <component...>`. Nothing is published to npm, so no `npx` name exists
  or is reserved. `SITE` (the default `--from`) and `MANIFEST`
  (`add/manifest.json`) are the site's `ADD_SITE` and `ADD_MANIFEST`,
  pinned by `packages/site/tests/kit-add.spec.ts`.
- The manifest it reads (`AddManifest` in `packages/site/build/kit-add.ts`):
  `version`, `stylings` (each system's layer, `solid` or `stylex`, the
  files every add brings and the stylesheets to load), `files` (a path in
  the copy: where the site serves it, its sha256, its imports and
  packages), `index` (each layer's index path and the kit index's
  statements, each with the file it exports from) and `components` (an
  export name: its file set per layer). A fetched file that does not
  match its hash stops the run.
- A name is the kit's export name, matched exactly, then in any case,
  then with its `Dither` prefix and punctuation dropped (`button`,
  `area-chart`); an ambiguous one is refused with its candidates.
- The guard: before writing, every file of the set (and the index) is
  read against the copy: new, the same, the site's to update (the copy's
  text is what the record says was written) or the reader's (anything
  else). A file the reader changed stops the whole run, with a unified
  diff of each and nothing written, unless `--force`. `--dry-run` prints
  each file's fate (add, update, same, keep or replace) and writes
  nothing, the settings and the record included. One copy holds one
  styling system: an add in another is refused.
- `diff` compares the copy with the site, file by file, as unified
  hunks; it exits 1 when anything differs (like `diff`). Every message is
  in sentence case, with no em dashes.

## Work Guidance

- Keep it readable as one page: arguments, the source (HTTP or a
  folder), names, the plan, the diff, the three commands.
- A change to the manifest's shape changes `packages/site/build/kit-add.ts`
  and this script together, with both specs.

## Verification

- `tests/add.spec.ts` (`npx rs test packages/add` at the root): the real
  script spawned in scratch projects against a scratch site folder: add
  and its index, settings and record; adding to a copy; each styling
  system's files; unknown names; the guard (a changed file shown and
  kept, nothing written, `--force` replacing it, an unchanged one
  updated, a torn download refused); `--dry-run`; `diff`; `list`.
- `packages/site/tests/kit-add.spec.ts`: the site's real manifest, and
  this script run against it in every styling system.
- Lint covers the file (`npm run lint`).

## Child DOX Index

- none
