import { editor, placeGeneration, selectedArtboard } from "../../entities/editor"
import { evolveArtboard, type EvolveOptions } from "@/features/agent/evolve"

export { evolveArtboard, mutateProps, type EvolveOptions } from "@/features/agent/evolve"
export { addLaunchFilm } from "./film"
export { type CommandResult, PROTOCOL_VERSION, registrySchema, runCommand, type StudioCommand } from "./commands"
export { COMMAND_EVENT, installStudioAgentApi, MIRROR_ID, RESULT_EVENT, type StudioAgentApi } from "./protocol"

/** The toolbar's evolve: a generation of the primary selection, placed as a
 * row beside it and selected. */
export function evolveSelected(opts: EvolveOptions = {}) {
  const parent = selectedArtboard.value
  if (!parent) return []
  const gen = placeGeneration(evolveArtboard(parent, { seed: Date.now() % 1_000_000, ...opts }))
  editor.replayToken++
  return gen
}
