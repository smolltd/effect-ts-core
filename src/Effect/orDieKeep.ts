import * as Cause from "../Cause/core"
import { foldCauseM_, halt, succeed } from "./core"
import type { Effect } from "./effect"

/**
 * Converts all failures to unchecked exceptions
 */
export function orDieKeep<S, R, E, A>(effect: Effect<S, R, E, A>) {
  return foldCauseM_(
    effect,
    (ce) => halt(Cause.chain((e: E) => Cause.Die(e))(ce)),
    succeed
  )
}