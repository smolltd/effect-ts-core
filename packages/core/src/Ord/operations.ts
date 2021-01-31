import * as Ord from "@effect-ts/system/Ord"

import type { Associative } from "../Associative"
import { makeAssociative } from "../Associative"
import type { Identity } from "../Identity"
import { makeIdentity } from "../Identity"
import { Associative as OrderingAssociative } from "../Ordering"

/**
 * Returns a `Associative` such that:
 *
 * - its `combine(ord2)(ord1)` operation will order first by `ord1`, and then by `ord2`
 */
export function getAssociative<A = never>(): Associative<Ord.Ord<A>> {
  return makeAssociative((y) => (x) =>
    Ord.fromCompare((b) => (a) =>
      OrderingAssociative.combine(y.compare(b)(a))(x.compare(b)(a))
    )
  )
}

/**
 * Returns a `Identity` such that:
 *
 * - its `combine(ord2)(ord1)` operation will order first by `ord1`, and then by `ord2`
 * - its `empty` value is an `Ord` that always considers compared elements equal
 */
export function getIdentity<A = never>(): Identity<Ord.Ord<A>> {
  return makeIdentity(
    Ord.fromCompare(() => () => 0),
    getAssociative<A>().combine
  )
}
