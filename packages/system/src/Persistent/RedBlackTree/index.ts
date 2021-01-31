import type { Ord } from "../../Ord"

export class Node<K, V> {
  public left: Node<K, V>
  public right: Node<K, V>
  constructor(
    public editable: boolean,
    public key: K,
    public value: V,
    public red: boolean,
    public count: number,
    left?: Node<K, V>,
    right?: Node<K, V>
  ) {
    this.left = left || this
    this.right = right || this
  }
}

export class RedBlackTree<K, V> {
  readonly _tag = "RedBlackTree"

  constructor(
    public editable: boolean,
    readonly ord: Ord<K>,
    public root: Node<K, V>,
    public size: number
  ) {}
}

/**
 * A read-only reference to an entry in a RedBlackTree instance.
 */
export interface RedBlackTreeEntry<K, V> {
  /**
   * Read only. The hash key of this entry in the tree.
   */
  readonly key: K
  /**
   * Read/write. The value of this entry in the tree.
   */
  value: V
}

export type Branch = "None" | "Left" | "Right"

export const None = new Node<any, any>(true, undefined, undefined, false, 0)

/**
 * Creates a new RedBlackTree
 */
export function make<K, V>(o: Ord<K>) {
  return new RedBlackTree<K, V>(false, o, None, 0)
}

/**
 * Creates a new Node
 */
export function makeNode<K, V>(
  tree: RedBlackTree<K, V>,
  red: boolean,
  key: K,
  value: V
) {
  return new Node<K, V>(tree.editable, key, value, red, 1, None, None)
}
