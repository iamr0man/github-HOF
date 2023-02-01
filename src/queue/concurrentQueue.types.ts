import { Owner, Repository } from '../result.types';

export interface TaskItem {
  name: string;
  fn: () => Promise<any>;
  result: any;
}
export interface Params {
  err: Error | string | null;
  result: TaskItem;
}
export type ProcessHandlerCallback = (params: Params) => void;
export type ProcessCallback<T> = (task: TaskItem) => Promise<T>;
export type FailureCallback = (err: Error | string) => void;
export type DoneCallback = (params: Params) => void;
export type SuccessCallback = (result: TaskItem) => void;
export type DrainCallback = () => void;

export interface Task {
  readonly key: number;
  readonly name: string;
}

export interface Queue {
  readonly start: () => void;
  readonly add: (task: Task) => void;
}

export interface QueueFactoryOptions {
  readonly concurrency?: number;

  readonly process: (task: Task) => Promise<unknown>;
  readonly onSucceed?: (task: Task, result: unknown) => void;
  readonly onFailed?: (task: Task, err: unknown) => void;
}

export type TaskResult = unknown[];

export type Result = [Repository, Owner][];

export interface RateLimit {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

export interface RateLimitResponse {
  resources: {
    core: RateLimit;
    search: RateLimit;
    graphql: RateLimit;
    integration_manifest: RateLimit;
    code_scanning_upload: RateLimit;
  };
  rate: RateLimit;
}
