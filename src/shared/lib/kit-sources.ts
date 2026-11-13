// Which files of the kit's folders are the kit's own sources: what the build
// serves under `KIT_SRC` and lists in its `files.json`, and so what the
// docs' source panel shows, runs and zips. One rule for the build
// (`solid-site/kit-sources.ts`) and the specs that read the same folders.

/** Where the build serves the kit's sources, relative to the site's base. */
export const KIT_SRC = "kit/src/solid/"

/** Whether `file`, a path inside one of the kit's folders with `/` between
 * its parts, is one of the kit's sources. */
export const isKitSource = (file: string): boolean => /\.(tsx?|css)$/.test(file) && !/^node_modules\//.test(file)
