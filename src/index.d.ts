// Type definitions for simple-data-loader

export = dataloader;

declare const dataloader: dataloader.SDLoader;

declare namespace dataloader {
  export interface LoaderOptions {
    ttl?: number;
    hash?: boolean;
    load?: Function;
    max?: number;
    curry?: boolean;
  }

  type ArgumentsType<T> = T extends (...args: infer U) => any ? U : never;
  type UnwrapReturnType<T extends (...args: any[]) => any> = T extends (...args: any[]) => Promise<infer K>
    ? K
    : ReturnType<T>;

  type Curry1<A, R> = (a: A) => R;

  type Curry2<A, B, R> = {
    (a: A): Curry1<B, R>;
    (a: A, b: B): R;
  };

  type Curry3<A, B, C, R> = {
    (a: A): Curry2<B, C, R>;
    (a: A, b: B): Curry1<C, R>;
    (a: A, b: B, c: C): R;
  };

  type Curry4<A, B, C, D, R> = {
    (a: A): Curry3<B, C, D, R>;
    (a: A, b: B): Curry2<C, D, R>;
    (a: A, b: B, c: C): Curry1<D, R>;
    (a: A, b: B, c: C, d: D): R;
  };

  type VariadicCurry<T, R> = T extends [any, any, any, any]
    ? Curry4<T[0], T[1], T[2], T[3], R>
    : T extends [any, any, any]
    ? Curry3<T[0], T[1], T[2], R>
    : T extends [any, any]
    ? Curry2<T[0], T[1], R>
    : T extends [any]
    ? Curry1<T[0], R>
    : unknown;

  export type SDLoader = <T extends (...args: any[]) => any>(
    fn: T,
    opts?: LoaderOptions
  ) => VariadicCurry<
    ArgumentsType<{
      (...args: ArgumentsType<T>): Promise<UnwrapReturnType<T>>;
      delete: (...args: ArgumentsType<T>) => boolean;
    }>,
    Promise<UnwrapReturnType<T>>
  >;
}
