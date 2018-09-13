// Type definitions for simple-data-loader

export = dataloader;

declare function dataloader<T extends Function>(fn: T, opts?: dataloader.LoaderOptions): dataloader.ResultInterface<T>;

declare namespace dataloader {
  export interface LoaderOptions {
    ttl?: number;
    hash?: boolean;
    load?: Function;
  }

  interface ResultInterface<T extends Function> {
    delete: (...args: ArgumentsType<T>) => boolean;
    load: (...args: ArgumentsType<T>) => Promise<ReturnType<T>>;
  }

  export type SDLoader<T extends Function> = (fn: T, opts?: LoaderOptions) => ResultInterface<T>;
}
