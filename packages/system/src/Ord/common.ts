import type { Ordering } from "../Ordering"
import type { Ord } from "./definition"
import { contramap_, fromCompare } from "./operations"

type Comparable = number | boolean | string

const compare = (y: Comparable): ((x: Comparable) => Ordering) => {
  return (x) => (x < y ? -1 : x > y ? 1 : 0)
}

export const ordBoolean: Ord<boolean> = fromCompare(compare)

export const ordNumber: Ord<number> = fromCompare(compare)

export const ordDate: Ord<Date> = contramap_(ordNumber, (date: Date) => date.valueOf())

export const ordString: Ord<string> = fromCompare(compare)
