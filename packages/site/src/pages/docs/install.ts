// The kit's install steps: the docs' Quick start shows them one step at a
// time (each its own copy), the source panel's prompt.md takes them as one
// commented script, and (kept in sync by hand, it never imports the docs)
// the landing's InstallBlock runs the same commands.

/** One step: what it does, why where a reader would ask, and its code. */
export type InstallStep = { title: string; why?: string; code: string }

/** The packages the kit needs beside Solid. */
export const INSTALL_DEPS: readonly string[] = ["d3-scale", "d3-shape", "clsx", "tailwind-merge"]

export const INSTALL_STEPS: readonly InstallStep[] = [
  {
    title: "Copy the kit folder straight from the repo",
    why: "degit grabs just the folder",
    code: "npx degit drvova/dither-ui/packages/dither-kit/src src/dither-kit",
  },
  {
    title: "Install the runtime deps",
    why: "you already have Solid, and Tailwind if you use it",
    code: `npm i ${INSTALL_DEPS.join(" ")}`,
  },
  {
    title: "Alias @dither-kit so imports stay clean",
    code: `// vite.config.ts
resolve: { alias: { "@dither-kit": "/src/dither-kit/solid" } }

// tsconfig.json, under compilerOptions
"paths": { "@dither-kit": ["./src/dither-kit/solid"] }`,
  },
  { title: "Use it", code: `import { AreaChart, Area, DitherButton } from "@dither-kit"` },
]

/** The steps as one commented script, numbered, for a reader who takes them whole. */
export const INSTALL: string = INSTALL_STEPS.map(
  (s, i) => `# ${i + 1}. ${s.title}${s.why ? ` (${s.why})` : ""}\n${s.code}`,
).join("\n\n")
