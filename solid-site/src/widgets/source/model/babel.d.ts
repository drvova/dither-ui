// The two packages Run compiles with, as far as Run uses them: neither
// ships types.
declare module "@babel/standalone" {
  export interface BabelNodePath {
    node: { meta?: { name: string }; source?: { value: string }; specifiers?: BabelSpecifier[]; importKind?: string }
    replaceWith(node: unknown): void
  }
  export interface BabelSpecifier {
    type: string
    importKind?: string
    imported?: { name?: string; value?: string }
  }
  export interface BabelPlugin {
    visitor: Record<string, (path: BabelNodePath) => void>
  }
  export function transform(
    code: string,
    options: {
      filename: string
      babelrc: false
      configFile: false
      sourceType: "module"
      presets: unknown[]
      plugins: (string | BabelPlugin | [string, Record<string, unknown>])[]
    },
  ): { code?: string | null }
  export const packages: { types: { identifier(name: string): unknown } }
}

declare module "babel-preset-solid" {
  const preset: (context: unknown, options?: Record<string, unknown>) => { plugins: unknown[] }
  export default preset
}
