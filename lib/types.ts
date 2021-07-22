/**
 * Restrict using either exclusively the keys of T or exclusively the keys of U.
 *
 * No unique keys of T can be used simultaneously with any unique keys of U.
 *
 * Example:
 * `const myVar: XOR<T, U>`
 *
 * see: https://github.com/maninak/ts-xor/tree/master#description
 */
export type XOR<T, U> = (T | U) extends Record<string, unknown>
  ? (without<T, U> & U) | (without<U, T> & T)
  : T | U;
type without<T, U> = {
  [P in Exclude<keyof T, keyof U>]?: never;
};

/**
 * Same as `XOR<T, U>` but for a list of types.
 *
 * Example:
 * `const myVar: AllXOR<[T1, T2, T3, etc...]>`
 *
 * see: https://github.com/microsoft/TypeScript/issues/14094#issuecomment-723571692
 */
export type AllXOR<T extends unknown[]> = T extends [infer Only] ? Only
  : T extends [infer A, infer B, ...infer Rest] ? AllXOR<[XOR<A, B>, ...Rest]>
  : never;

/**
 * According to Wikipedia, a set is a well-defined collection of distinct
 * (unique) objects. We've already got a Set type in JavaScript enforcing
 * this at runtime, but to have TypeScript do the same, we'll have to use
 * arrays declared as const, as opposed to ordinary arrays.
 *
 * see: https://ja.nsommer.dk/articles/type-checked-unique-arrays.html
 */
export type UniqueArray<T> = T extends readonly [infer X, ...infer Rest]
  ? inArray<Rest, X> extends true ? ["Encountered value with duplicates:", X]
  : readonly [X, ...UniqueArray<Rest>]
  : T;
type inArray<T, X> = T extends readonly [X, ...infer _Rest] ? true
  : T extends readonly [X] ? true
  : T extends readonly [infer _, ...infer Rest] ? inArray<Rest, X>
  : false;
