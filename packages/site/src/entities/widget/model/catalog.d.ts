// The docs' examples as the build reads them (`build/catalog.ts`): every
// example's `meta` resolved into its entry, and every example's text as a
// reader copies it, by its id (`<pack>/<file>`).
declare module "virtual-dither-catalog" {
  export const CATALOG: readonly import("../../../shared/lib/example").CatalogEntry[]
}
declare module "virtual-dither-catalog/sources" {
  const sources: Readonly<Record<string, string>>
  export default sources
}
