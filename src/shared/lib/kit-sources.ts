// Which files of a kit's folder are the kit's own sources: what the build
// serves at `kit/src/<flavor>/` and lists in `files.json`, and so what the
// docs' source panel shows, runs and zips. One rule for the build
// (`solid-site/kit-sources.ts`) and the specs that read the same folders.

/** Whether `file`, a path inside one of a kit's folders with `/` between
 * its parts, is one of that kit's sources. */
export const isKitSource = (file: string): boolean => /\.(svelte|tsx?|css)$/.test(file) && !/^node_modules\//.test(file)
