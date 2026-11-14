# restyle

## Purpose

What writes Solid code for a reader in their styling system. A snippet or
an exported frame reaches it as Solid with Tailwind classes; this package
rewrites it with a stylesheet the file imports, CSS Modules or StyleX from the declarations
Tailwind's own compiler gives each class, and generates the kit's StyleX
twin the same way. Paths here are from this package's root.

## Ownership

- `src/index.ts`: the rewriter, the package's entry (`@dither-ui/restyle`), framework
  free and safe in a browser. It reads and writes Solid only (JSX `class`
  and `style`): `restyleSolid(code, system, name)` gives the code and the
  stylesheet it imports, `restyle(code, system)` the two as one text. Also
  `compileUtilities`, `Names`, `stylexText`, the styling
  systems and their labels, and the `UtilityMap` type.
- `src/utility-map.ts` (`@dither-ui/restyle/utility-map`), Node only:
  `buildUtilityMap(dirs)` scans the folders a caller names and compiles
  every class candidate, and `utilityMap(sources)` is the Rsbuild plugin
  that hands the result to a build as the virtual module
  `virtual-dither-utilities` (the site's Vite plugin wraps the same
  builder).
- `src/stylex-layer-solid.ts` (`@dither-ui/restyle/stylex-layer`), Node only: the
  generator of the kit's StyleX twin, over `src/stylex-core.ts` (the
  class-to-StyleX core, internal).
- `src/utilities.d.ts`: the type of the virtual module.
- Does not own the vocabulary: the caller names the folders whose classes
  count (the site's `packages/site/build/utility-sources.ts`; the
  generator's spec names the kit's own folders).

## Local Contracts

- It reads Solid only: the docs' snippets are written in Solid, and the
  site hands them to it as they are.

- Depends on `@dither-ui/kit` only, for one file: the kit's token mapping and
  dark variant are read from `@dither-ui/kit/tailwind/kit.css`, found through
  the kit's `exports` (one source of truth). It never names the site or
  the StyleX twin (`tests/workspace.spec.ts` at the root).
- Three entries, not one: the rewriter runs in the page, while the utility
  map (Tailwind's compiler, the file system) and the generator
  (TypeScript's compiler) run in Node. One entry would pull the Node half
  into every browser bundle that imports the rewriter.
- `src/index.ts` imports `virtual-dither-utilities`: whoever bundles it
  supplies the module, with `utilityMap` (Rsbuild, Rstest) or a plugin
  over `buildUtilityMap` (Vite). Config files load `utility-map.ts` under
  Node's own TypeScript, so its run-time imports carry `.ts`.
- The theme is inlined (spacing, radii, breakpoints become values) while
  the kit's tokens stay `var(--foreground)`-style references: the contract
  an app themes through.
- The generator refuses what it cannot carry, by file and line, and writes
  no file for it. A generated file names the kit's files as the kit
  exports them (`@dither-ui/kit/engine/<file>`, `@dither-ui/kit/solid/<file>`).

## Work Guidance

- A snippet idiom the rewriter mangles gets a rule in `src/index.ts` and a
  case in `tests/restyle.spec.ts`.

## Verification

- `npx rs test packages/restyle` at the root: `tests/restyle.spec.ts`
  (the map's shape, each styling system on Solid code, StyleX as its
  compiler takes it).
  The spec reads the vocabulary the workspace's `rstack.config.ts`
  compiles, which is the site's.
- The generator is held by the twin's own spec
  (`packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts`), and
  every docs snippet in every system by the site's
  (`packages/site/tests/stylex-coverage.spec.ts`,
  `packages/site/tests/site/source.spec.tsx`).

## Child DOX Index

- none
