// Type definitions for simple-data-loader

export = dataloader;

declare const dataloader: dataloader.SDLoader;

declare namespace dataloader {
  export interface LoaderOptions {
    ttl?: number;
    hash?: boolean;
    load?: Function;
  }

  type UnwrapReturnType<T extends (...args: any[]) => any> = T extends (...args: any[]) => Promise<infer K> ? K : ReturnType<T>;
  type ArgumentsType<T> = T extends  (...args: infer U) => any ? U: never;

  interface ResultInterface<T extends (...args: any[]) => any> {
    delete: (...args: ArgumentsType<T>) => boolean;
    load: (...args: ArgumentsType<T>) => Promise<UnwrapReturnType<T>>;
  }

  export type SDLoader = <T extends (...args: any[]) => any>(fn: T, opts?: LoaderOptions) => ResultInterface<T>;
}
