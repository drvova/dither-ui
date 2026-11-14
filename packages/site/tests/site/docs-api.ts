// What the specs read of the Solid kit by the type checker: every prop each
// component takes and whether a value fits it (`registry-props.spec.ts`).
import { join } from "node:path"
import ts from "typescript"

export const SITE = join(__dirname, "../..")
export const DOCS = join(SITE, "src/pages/docs")

/** A value a Studio setting may hand a prop: what the registry's kinds hold. */
type Plain = string | number | boolean | readonly string[]

export type Kit = {
  /** The props each component takes: the properties of its function's own
   * parameter (its exported `<Name>Props`), a union's every shape's. */
  props: Map<string, Set<string>>
  /** Whether the component's prop takes the value, by its declared type
   * (`undefined`: the component takes no such prop). */
  accepts(component: string, prop: string, value: Plain): boolean | undefined
}

export function readKit(): Kit {
  const config = ts.getParsedCommandLineOfConfigFile(
    join(SITE, "../../tsconfig.json"),
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (d) => {
        throw new Error(ts.flattenDiagnosticMessageText(d.messageText, "\n"))
      },
    },
  )!
  const entry = join(SITE, "../dither-kit/src/solid/index.ts")
  const program = ts.createProgram([entry], { ...config.options, noEmit: true })
  const checker = program.getTypeChecker()
  const types = new Map<string, Map<string, ts.Type[]>>()
  for (const exported of checker.getExportsOfModule(checker.getSymbolAtLocation(program.getSourceFile(entry)!)!)) {
    if (!/^[A-Z]/.test(exported.name)) continue
    const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported
    if (!(symbol.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Variable))) continue
    const [call] = checker.getTypeOfSymbol(symbol).getCallSignatures()
    if (!call) continue
    const props = new Map<string, ts.Type[]>()
    if (call.parameters[0]) {
      const type = checker.getTypeOfSymbol(call.parameters[0])
      for (const shape of type.isUnion() ? type.types : [type])
        for (const p of checker.getPropertiesOfType(checker.getApparentType(shape)))
          props.set(p.name, [...(props.get(p.name) ?? []), checker.getTypeOfSymbol(p)])
    }
    types.set(exported.name, props)
  }
  const typeOf = (value: string | number | boolean): ts.Type =>
    typeof value === "string"
      ? checker.getStringLiteralType(value)
      : typeof value === "number"
        ? checker.getNumberLiteralType(value)
        : value
          ? checker.getTrueType()
          : checker.getFalseType()
  const fits = (value: Plain, target: ts.Type): boolean => {
    // a generic component's `T` takes what its constraint does, or anything
    if (target.flags & ts.TypeFlags.TypeParameter) {
      const constraint = checker.getBaseConstraintOfType(target)
      return !constraint || constraint === target || fits(value, constraint)
    }
    if (typeof value !== "object") return checker.isTypeAssignableTo(typeOf(value), target)
    // a list fits an array of what each of its items fits
    return (target.isUnion() ? target.types : [target]).some((t) => {
      const item = checker.isArrayType(t) ? checker.getIndexTypeOfType(t, ts.IndexKind.Number) : undefined
      return item !== undefined && value.every((v) => fits(v, item))
    })
  }
  return {
    props: new Map([...types].map(([name, props]) => [name, new Set(props.keys())])),
    accepts(component, prop, value) {
      const shapes = types.get(component)?.get(prop)
      return shapes && shapes.some((t) => fits(value, t))
    },
  }
}
