// The folders whose class strings can end up in a docs snippet or a Studio
// export: the docs and the entities. What the styling rewriter can carry is
// compiled from them (`restyle/utility-map`), for the site's build and the
// workspace's specs alike.
import { join } from "node:path"

export const UTILITY_SOURCES: readonly string[] = ["../src/pages/docs", "../src/entities"].map((dir) =>
  join(import.meta.dirname, dir),
)
