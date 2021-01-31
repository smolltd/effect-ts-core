/**
 * Forked and ported from @frptools/structural
 */

import { throwArgumentError } from "../Errors"

/**
 * A mutation context stores contextual information with respect to the temporary mutability of a
 * persistent object and zero or more other persistent objects (of the same or differing types) with
 * which it is associated. Once a mutation context has been frozen, it cannot be unfrozen; the
 * associated persistent objects must first be cloned with new mutation contexts. Committing a
 * mutation context is an in-place operation; given that it indicates that mutability is permitted,
 * the committing of the context (and all associated persistent objects) is therefore the final
 * mutable operation performed against those objects.
 */
export class MutationContext {
  constructor(
    /**
     * A shared token indicating whether the mutation context is still active, or has become frozen.
     * A one-tuple is used because arrays can be shared by reference among multiple mutation contexts,
     * and the sole element can then be switched from `true` to `false` in order to simultaneously
     * make all associated persistent objects immutable with a single O(1) operation.
     */
    public readonly token: [boolean],
    /**
     * Indicates whether this MutationContext instance originated with the value to which it is
     * attached. If true, the shared token may be frozen when mutations are complete. If false, then
     * the committing of the shared token must be performed with reference to the value where the
     * mutation context originated. Note that a non-owned MutationContext instance can itself be
     * shared among many persistent objects. For many objects to participate in a larger mutation
     * batch, it is only necessary to have two MutationContext instances; one for the owner, and one
     * for all subsequent persistent objects that are participating in, but not in control of, the
     * scope of the mutations.
     */
    public scope: number
  ) {}
}

export const mctxSym = Symbol()
export const cloneSym = Symbol()

/**
 * All persistent structures must implement this interface in order to participate in batches of
 * mutations among multiple persistent objects of different types. Though designed to allow for
 * batched mutations, `Persistent` and the associated API functions provide a convenient
 * suite of functionality for providing any structural type with persistent/immutable behaviour and
 * associated mutation characteristics.
 */
export interface Persistent {
  /**
   * The associated mutation context. During construction of the first version of a persistent
   * object, use `immutableContext()` if default immutability is required, or `mutableContext()` if
   * the object should be constructed in a mutable state. Do not reassign this property after it has
   * been assigned during construction. Do not ever directly modify its internal properties.
   */
  readonly [mctxSym]: MutationContext

  /**
   * Create a clone of the structure, retaining all relevant internal properties and state as-is.
   * The method is provided with a new MutationContext instance, which should be assigned to the
   * clone of the object during construction. Internal subordinate persistent substructures should
   * not be cloned at this time. When updates are being applied to a persistent object,
   * substructures should use `asMutable()`, with their owning structure passed in as the joining
   * context.
   */
  readonly [cloneSym]: (mctx: MutationContext) => Persistent
}

export type PreferredContext = MutationContext | Persistent | boolean

/**
 * Performs a shallow clone of a persistent structure. It is up to the API that provides structural
 * manipulation operations on the input type to ensure that, before applying mutations, any relevant
 * internal substructures are cloned when their associated mutation contexts do not match that of
 * their owner.
 */
export function clone<T extends Persistent>(value: T, pctx?: PreferredContext): T {
  return <T>value[cloneSym](selectContext(pctx))
}

export const Frozen = Object.freeze(new MutationContext([false], -1))

/**
 * Returns a mutation context that matches the mutability characteristics of the supplied argument.
 * If no argument is supplied, an immutable context is returned. If the argument is another mutable
 * object, the returned context will be a mutable subordinate to that context, or a direct reference
 * to that context if it is already subordinate to some other mutable context.
 */
export function selectContext(pctx?: PreferredContext): MutationContext {
  return pctx === void 0
    ? Frozen
    : typeof pctx === "boolean"
    ? pctx
      ? mutable()
      : Frozen
    : // : isMutationContext(pctx) ? isMutableContext(pctx) ? pctx : FROZEN
    isMutationContext(pctx)
    ? isMutableContext(pctx)
      ? pctx
      : Frozen
    : getSubordinateContext(pctx)
}

/**
 * Returns a new mutable context to be associated with, and owned by, a persistent object. This
 * function should only be used when constructing the first version of a new persistent object. Any
 * subsequent updates to that object should use `asMutable()` and related functions.
 */
export function mutable(): MutationContext {
  return new MutationContext([true], 0)
}

/**
 * Determines whether a value is a MutationContext object instance.
 */
export function isMutationContext(value: any): value is MutationContext {
  return typeof value === "object" && value instanceof MutationContext
}

export function isMutableContext(mctx: MutationContext): boolean {
  return mctx.token[0]
}

export function isImmutableContext(mctx: MutationContext): boolean {
  return !isMutableContext(mctx)
}

/**
 * Returns a mutation context that is subordinate to that of the object it was created for. The
 * returned mutation context matches the mutability of the one from which it is being cloned.
 */
export function getSubordinateContext(value: Persistent): MutationContext {
  return asSubordinateContext(getMutationContext(value))
}

/**
 * Returns a mutation context that is subordinate to the input context. The returned context cannot
 * be used to complete a batch of mutations, but objects to which it is attached will automatically
 * become immutable when the original (non-subordinate) context is frozen. If the input context is
 * already subordinate to another, it can be safely shared among multiple host objects, and is
 * therefore returned as-is, rather than being cloned. Mutation contexts do not retain any
 * hierarchy beyond being subordinate to the originating/owning context, hence the lack of
 * subsequent cloning. This also reduces allocations by enabling reference sharing.
 */
export function asSubordinateContext(mctx: MutationContext): MutationContext {
  return mctx.scope >= 0 ? new MutationContext(mctx.token, -1) : mctx
}

export function isPrimaryContext(mctx: MutationContext): boolean {
  return mctx.scope >= 0
}

export function isSubordinateContext(mctx: MutationContext): boolean {
  return mctx.scope === -1
}

function close(mctx: MutationContext): void {
  mctx.token[0] = false
}

function token(value: Persistent): [boolean] {
  return getMutationContext(value).token
}

function incScope(mctx: MutationContext): void {
  mctx.scope++
}

function decScope(mctx: MutationContext): void {
  mctx.scope--
}

export function isRelatedContext(a: MutationContext, b: MutationContext): boolean {
  return a.token === b.token
}

export function getMutationContext(value: Persistent): MutationContext {
  return value[mctxSym]
}

export interface PersistentConstructor<T extends Persistent> {
  new (...args: any[]): T
}

/**
 * Checks whether the input function constructs an instance of the `Persistent` interface.
 */
export function isPersistentConstructor(
  value: Function
): value is PersistentConstructor<Persistent> {
  return typeof value === "function" && typeof value.prototype[cloneSym] === "function"
}

/**
 * Checks whether the input object implements the `Persistent` interface, and narrows the input type
 * accordingly.
 */
export function isPersistent(value: object): value is Persistent {
  return mctxSym in value
}

/**
 * Returns the default frozen mutation context for use with new immutable objects. This function
 * should only be used when constructing the first version of a new persistent object. Any
 * subsequent copies of that object should use `doneMutating()` and related functions.
 */
export function immutable(): MutationContext {
  return Frozen
}

/**
 * Makes a mutable context immutable, along with all associated subordinate contexts. If the input
 * argument is itself a subordinate context, this function does nothing.
 */
export function commitContext(mctx: MutationContext): void {
  if (isPrimaryContext(mctx)) close(mctx)
}

/**
 * Tests whether the value is currently in a mutable state, with changes able to be applied directly
 * to the value, rather than needing to clone the value first.
 */
export function isMutable(value: Persistent): boolean {
  return isMutableContext(getMutationContext(value))
}

/**
 * Tests whether the value is currently in an immutable state, requiring a clone to be created if
 * mutations are desired.
 */
export function isImmutable(value: Persistent): boolean {
  return !isMutable(value)
}

/**
 * Tests whether two values are currently part of the same active batch of uncommitted mutations,
 * whereby committing the mutation context of the value where it originated will cause all other
 * structures that share the same mutation context to become immutable also.
 *
 * After a shared context is committed, this function can be used to lazily apply changes to data
 * structures that are private and internal to an outer data structure. An example is `Slot` objects
 * contained within the `List` data structure. Those objects are never accessed via the `List`
 * structure's public API, but are often the target of latebound changes applied well after a
 * mutation context has been committed. By checking if they shared the same context as their parent,
 * it can be determined whether they need to be cloned and replaced, or if they can be mutated in
 * place so as to apply any pending changes before their internal data is queried as part of a call
 * being made against the outer structure.
 */
export function areContextsRelated(a: Persistent, b: Persistent): boolean {
  return token(a) === token(b)
}

export function hasRelatedContext(mctx: MutationContext, value: Persistent): boolean {
  return mctx.token === token(value)
}

export function begin<T extends Persistent>(value: T): T {
  const mc = getMutationContext(value)
  return isMutableContext(mc)
    ? isSubordinateContext(mc)
      ? value
      : (incScope(mc), value)
    : clone(value, mutable())
}

export function commit<T extends Persistent>(value: T): T {
  const mc = getMutationContext(value)
  return isPrimaryContext(mc) && (mc.scope === 0 ? close(mc) : decScope(mc)), value
}

/**
 * Returns the second argument as a mutable subordinate of the first argument. If the first argument is already
 * subordinate to an existing mutation context, the subordinate context reference is shared as-is. Committing the
 * primary context's modifications (via commit(), passing in the context owner) has the side effect of ending
 * modifications on any mutable objects whose mutation context is subordinate to the primary context. Committing
 * modifications directly on a subordinate object has no effect; that object will remain mutable until commit() is
 * called on the context owner (i.e. the object for which the mutable context was originally created).
 */
export function modifyAsSubordinate<T extends Persistent>(
  context: Persistent | MutationContext,
  value: T
): T {
  const mctxChild = getMutationContext(value)
  const mctxParent = isMutationContext(context) ? context : getMutationContext(context)

  return isMutableContext(mctxParent)
    ? isRelatedContext(mctxChild, mctxParent) && isSubordinateContext(mctxChild)
      ? value
      : clone(value, asSubordinateContext(mctxParent))
    : throwArgumentError(
        "context",
        "The first argument must refer to a mutable object or mutation context"
      )
}
