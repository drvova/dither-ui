// The utility map the styling rewriter reads, a virtual module each build
// makes from `shared/lib/utility-map.ts` (the Solid site's Vite plugin, the
// root's Rstest plugin).
declare module "virtual-dither-utilities" {
  const map: import("./shared/lib/restyle-rewrite").UtilityMap
  export default map
}
