import { effect as T, freeEnv as F } from "@matechs/effect";
import * as assert from "assert";
import { pipe } from "fp-ts/lib/pipeable";
import * as O from "fp-ts/lib/Option";
import { Spec, Suite, Test } from "./def";
import { getTimeout } from "./aspects/timeout";
import { getSkip } from "./aspects/skip";
import { identity } from "fp-ts/lib/function";

export const testM = (name: string) => <R, E>(eff: T.Effect<R, E, void>): Spec<R> => ({
  _R: undefined as any,
  _tag: "test",
  name,
  eff,
  config: {}
});

export type ROf<S extends Spec<any>> = unknown extends S["_R"] ? never : S["_R"];

export const suite = (name: string) => <Specs extends Spec<any>[]>(
  ...specs: Specs
): Spec<F.UnionToIntersection<ROf<Exclude<Specs[number], Spec<unknown>>>>> => ({
  _R: undefined as any,
  _tag: "suite",
  name,
  specs
});

export { assert };

export const run = <Specs extends Spec<any>[]>(...specs: Specs) => (
  provider: unknown extends F.UnionToIntersection<ROf<Exclude<Specs[number], Spec<unknown>>>>
    ? void
    : <E, A>(
        _: T.Effect<F.UnionToIntersection<ROf<Exclude<Specs[number], Spec<unknown>>>>, E, A>
      ) => T.Effect<unknown, E, A>
) => {
  specs.map((s) => {
    switch (s._tag) {
      case "suite": {
        desc(s, (provider || identity) as any);
        break;
      }
      case "test": {
        describe(`Root: ${s.name}`, () => {
          runTest(s, (provider || identity) as any);
        });
      }
    }
  });
};

function desc<Suites extends Suite<any>[]>(
  s: Suite<any>,
  provider: <E, A>(
    _: T.Effect<F.UnionToIntersection<ROf<Exclude<Suites[number], Suites[number]>>>, E, A>
  ) => T.Effect<unknown, E, A>
) {
  describe(s.name, () => {
    s.specs.map((spec) => {
      switch (spec._tag) {
        case "suite": {
          describe(spec.name, () => {
            spec.specs.forEach((child) => {
              switch (child._tag) {
                case "suite": {
                  desc(child, provider);
                  break;
                }
                case "test": {
                  runTest(child, provider);
                  break;
                }
              }
            });
          });
          break;
        }
        case "test": {
          runTest(spec, provider);
          break;
        }
      }
    });
  });
}

function runTest<R>(spec: Test<R>, provider: <E, A>(_: T.Effect<R, E, A>) => T.Effect<unknown, E, A>) {
  pipe(
    getSkip(spec),
    O.filter((x): x is true => x === true),
    O.fold(
      () => {
        it(spec.name, async () => pipe(spec.eff, provider, T.runToPromise), pipe(spec, getTimeout, O.toUndefined));
      },
      () => {
        it.skip(spec.name, async () => pipe(spec.eff, provider, T.runToPromise), pipe(spec, getTimeout, O.toUndefined));
      }
    )
  );
}
