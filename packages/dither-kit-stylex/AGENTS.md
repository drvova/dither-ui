# dither-kit-stylex

## Purpose

The kit's components in StyleX: the Solid layer of `@dither-ui/kit`, GENERATED
file for file, so an app that styles with StyleX runs the same components
with no Tailwind. Paths here are from this package's root.

## Ownership

- `src/`: one generated file per component and module of the kit's Solid
  layer (`@dither-ui/kit/solid/`), the index among them, plus
  `runtime/chart-layer.tsx` (the one runtime file that writes classes) and
  `control.ts` (from `@dither-ui/kit/tailwind/control.ts`). Only `src/lib.ts`
  (`cn` over `stylex.props`, `StyleProp`) is written by hand.
- `tests/stylex-layer-solid.spec.ts`: writes the source and fails on any
  drift.
- Does not own the generator (`@dither-ui/restyle/stylex-layer`,
  `packages/restyle/AGENTS.md`) or what the Solid source must keep to so
  it can be carried (`packages/dither-kit/AGENTS.md`).

## Local Contracts

- Never edit a generated file: edit the Solid file in the kit, then run
  `npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts`
  at the root. Each file's first lines name its source and that command.
- One `stylex.create` a file; an element's own styles are
  `{...stylex.props(...)}`, merged ones `class={cn(...)}`; a component
  that takes `class` takes `xstyle` too (StyleX styles or class names,
  merged after its own, so the last style to set a property wins), and kit
  components hand each other styles through it.
- The engine, the Solid layer's runtime and the components' stylesheets
  are the kit's, imported by its name and never copied
  (`@dither-ui/kit/engine/<file>.ts`, `@dither-ui/kit/solid/runtime/<file>`,
  `@dither-ui/kit/solid/<Name>.css`).
- Depends on `@dither-ui/kit` (and `@stylexjs/stylex`, `solid-js` as peers).
  `@dither-ui/restyle` is a development dependency, for the spec alone: no file of
  `src/` imports it (`tests/workspace.spec.ts` at the root).
- A reader who copies folders instead of installing takes this `src/`
  beside the kit's, aliases `@dither-kit` to it and `@dither-ui/kit` to their
  copy of the kit (`README.md`).

## Work Guidance

## Verification

- `tests/stylex-layer-solid.spec.ts` (`npx rs test` at the root)
  regenerates the layer and fails on any drift, any Tailwind class left
  (only the components' own hooks stay class names) and any utility input
  whose effect was lost.
- `packages/site/tests/site/stylex-layer.spec.tsx` mounts the generated
  components on the docs' StyleX runtime.

## Child DOX Index

- none
