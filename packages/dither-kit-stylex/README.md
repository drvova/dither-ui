# @dither-ui/kit-stylex

The [dither-kit](../dither-kit/README.md) components in StyleX, generated
from the kit's Tailwind-classed Solid layer. Every component is the same
component: same props, same engine, same stylesheets for what a utility
cannot say, with its Tailwind classes written as `stylex.create` styles.
A component that takes `class` also takes `xstyle`: your StyleX styles,
merged after its own.

The source imports the engine and the Solid layer's runtime from
`@dither-ui/kit` by name, so the two packages go together.

Copying folders instead of installing:

```bash
npx degit drvova/dither-ui/packages/dither-kit/src src/dither-kit
npx degit drvova/dither-ui/packages/dither-kit-stylex/src src/dither-kit-stylex
npm i d3-scale d3-shape @stylexjs/stylex
```

Then alias both names (bundler `resolve.alias` and tsconfig `paths`):

```
"@dither-kit"    -> "./src/dither-kit-stylex"
"@dither-ui/kit" -> "./src/dither-kit"
```

Compile the folder with your bundler's StyleX plugin and load the kit's
`engine/theme.css` and `engine/base.css`.

Do not edit these files: they are written from the kit's Solid layer by
the repository's generator, and a spec fails when they drift.
