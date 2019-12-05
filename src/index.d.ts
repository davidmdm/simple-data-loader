// Type definitions for simple-data-loader

export = dataloader;

declare const dataloader: dataloader.LoaderBuilder;

type ArgumentsType<T> = T extends (...args: infer U) => any ? U : never;
type UnwrapReturnType<T extends (...args: any[]) => any> = T extends (...args: any[]) => Promise<infer K>
  ? K
  : ReturnType<T>;

declare namespace dataloader {
  export type LoaderOptions = {
    ttl?: number;
    hash?: boolean;
    max?: number;
    rolling?: boolean;
    autoRefresh?: number;
  };

  export type Loader<T extends (...args: any[]) => any> = {
    (...args: ArgumentsType<T>): Promise<UnwrapReturnType<T>>;
    delete: (...args: ArgumentsType<T>) => boolean;
    onDelete: (fn: (...args: ArgumentsType<T>) => any) => Loader<T>;
  };

  export type LoaderBuilder = <T extends (...args: any[]) => any>(fn: T, opts?: LoaderOptions) => Loader<T>;
}
