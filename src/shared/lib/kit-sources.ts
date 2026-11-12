// Which files of a kit's folder are the kit's own sources: what the build
// serves at `kit/src/<flavor>/` and lists in `files.json`, and so what the
// docs' source panel shows, runs and zips. One rule for the build
// (`rstack.config.ts`) and the specs that read the same folders.

/** Whether `file`, a path inside a kit's folder with `/` between its parts,
 * is one of that kit's sources. The Solid layer growing beside the Vue kit
 * (`dither-kit/solid/`) is not part of the Vue kit's listing. */
export const isKitSource = (file: string): boolean =>
  /\.(vue|svelte|ts|css)$/.test(file) && !/^(node_modules|solid)\//.test(file)
