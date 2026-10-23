import { inject, type InjectionKey } from "vue"
import type { Bench } from "./bench"

export const BENCH: InjectionKey<Bench> = Symbol("workbench")

/** The workbench of the preview this component draws for. */
export function useBench(): Bench {
  const bench = inject(BENCH)
  if (!bench) throw new Error("useBench() outside a Workbench")
  return bench
}
