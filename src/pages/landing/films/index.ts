// Node-side only — see kit-dither.ts. Every film the landing plays, by the
// id its document is written under (public/films/<id>.json).
import { catalogFilm } from "./catalog"
import { dawnFilm } from "./dawn"
import { heroFilm } from "./hero"
import { reelFilm } from "./reel"
import { studioFilm } from "./studio"

export const FILMS = {
  hero: heroFilm,
  studio: studioFilm,
  reel: reelFilm,
  dawn: dawnFilm,
  catalog: catalogFilm,
} as const
