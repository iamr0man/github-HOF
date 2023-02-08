import {
  Owner,
  RateLimitResponse,
  Repository,
  RepositoryResponse,
} from '../result.types';

export enum TaskName {
  GET_REPOSITORIES = 'GET_REPOSITORIES',
  GET_OWNER = 'GET_OWNER',
  GET_RATE_LIMIT = 'GET_RATE_LIMIT',
}

export type TaskRepository = {
  name: TaskName.GET_REPOSITORIES;
  result: RepositoryResponse;
};

export type TaskOwner = {
  name: TaskName.GET_OWNER;
  result: Owner;
};

export type TaskRateLimit = {
  name: TaskName.GET_RATE_LIMIT;
  result: RateLimitResponse;
};

export type TaskResult = TaskOwner | TaskRepository | TaskRateLimit;

export interface Task {
  readonly name: TaskName;
}

export interface Queue<T> {
  readonly start: () => Promise<void[]>;
  readonly add: (task: T) => void;
}

export interface QueueFactoryOptions<T, R> {
  readonly concurrency?: number;

  readonly process: (task: T) => Promise<R>;
  readonly onSucceed?: (task: T, result: R) => Promise<void>;
  readonly onFailed?: (task: T, err: unknown) => Promise<void>;
}

export type Result = Array<[Repository, Owner]>;
