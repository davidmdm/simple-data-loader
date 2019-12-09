// Type definitions for simple-data-loader

export = dataloader;

declare const dataloader: dataloader.LoaderBuilder;

type ArgumentsType<T> = T extends (...args: infer U) => any ? U : never;
type UnwrapReturnType<T extends (...args: any[]) => any> = T extends (...args: any[]) => Promise<infer K>
  ? K
  : ReturnType<T>;

type Fn = (...args: any[]) => any;

declare namespace dataloader {
  export type LoaderOptions<T extends Fn> = {
    ttl?: number;
    hash?: boolean;
    max?: number;
    rolling?: boolean;
    autoRefresh?: number;
    onDelete?: (...args: ArgumentsType<T>) => any;
  };

  export type Loader<T extends Fn> = {
    (...args: ArgumentsType<T>): Promise<UnwrapReturnType<T>>;
    delete: (...args: ArgumentsType<T>) => boolean;
    onDelete: (fn: (...args: ArgumentsType<T>) => any) => Loader<T>;
  };

  export type LoaderBuilder = <T extends Fn>(fn: T, opts?: LoaderOptions<T>) => Loader<T>;
}
