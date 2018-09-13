// Type definitions for simple-data-loader

export = dataloader;

declare function dataloader<T extends (...args: any[]) => any>(fn: T, opts?: dataloader.LoaderOptions): dataloader.ResultInterface<T>;

declare namespace dataloader {
  export interface LoaderOptions {
    ttl?: number;
    hash?: boolean;
    load?: Function;
  }

  type UnwrapPromise<T extends Promise<any>> = T extends Promise<infer K> ? K : never;
  type UnwrapReturnType<T extends (...args: any[]) => any> = T extends (...args: any[]) => Promise<infer K> ? K : ReturnType<T>;
  type ArgumentsType<T> = T extends  (...args: infer U) => any ? U: never;

  interface ResultInterface<T extends (...args: any[]) => any> {
    delete: (...args: ArgumentsType<T>) => boolean;
    load: (...args: ArgumentsType<T>) => Promise<UnwrapReturnType<T>>;
  }

  export type SDLoader<T extends (...args: any[]) => any> = (fn: T, opts?: LoaderOptions) => ResultInterface<T>;
}
