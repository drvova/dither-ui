// The utility map the styling rewriter reads (`../utilities.ts` builds it).
declare module "virtual-dither-utilities" {
  const map: import("@/shared/lib/restyle-rewrite").UtilityMap
  export default map
}

// A shared module's type-only import can lead the type checker into the Vue
// site's files (never the bundle: such imports are erased). A `.vue` file
// met that way is only ever a type's source.
declare module "*.vue" {
  const component: unknown
  export default component
}
