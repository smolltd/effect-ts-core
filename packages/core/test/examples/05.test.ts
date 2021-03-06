import { constant, pipe } from "@effect-ts/system/Function"

import * as R from "../../src/Dictionary"
import * as E from "../../src/Either"
import * as X from "../../src/XPure"

test("05", () => {
  pipe(
    { a: 0, b: 1, c: 2, d: 3 },
    R.separateF(X.Applicative)((n) =>
      X.succeed(constant(n < 2 ? E.left(n) : E.right(n)))
    ),
    X.chain((r) =>
      X.sync(() => {
        console.log(r)
      })
    ),
    X.runIO
  )
})
