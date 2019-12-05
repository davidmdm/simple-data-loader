// Type definitions for simple-data-loader

export = dataloader;

declare const dataloader: dataloader.SDLoader;

declare namespace dataloader {
  export interface LoaderOptions {
    ttl?: number;
    hash?: boolean;
    max?: number;
    rolling?: boolean;
    autoRefresh?: number;
  }

  type ArgumentsType<T> = T extends (...args: infer U) => any ? U : never;
  type UnwrapReturnType<T extends (...args: any[]) => any> = T extends (...args: any[]) => Promise<infer K>
    ? K
    : ReturnType<T>;

  export type SDLoader = <T extends (...args: any[]) => any>(
    fn: T,
    opts?: LoaderOptions
  ) => {
    (...args: ArgumentsType<T>): Promise<UnwrapReturnType<T>>;
    delete: (...args: ArgumentsType<T>) => boolean;
    onDelete: (fn: (...args: ArgumentsType<T>) => any) => void;
  };
}
