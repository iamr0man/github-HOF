import { Owner, Repository, RepositoryResponse } from '../result.types';

export enum TaskName {
  GET_REPOSITORIES = 'GET_REPOSITORIES',
  GET_OWNER = 'GET_OWNER',
  CLEAR_QUEUE = 'CLEAR_QUEUE',
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
  name: TaskName.CLEAR_QUEUE;
};

export type TaskResult = TaskOwner | TaskRepository | TaskRateLimit;

export interface Task {
  readonly name: TaskName;
}

export interface Queue<T> {
  readonly start: () => Promise<void[]>;
  readonly add: (task: T) => void;
  readonly clear: () => void;
}

export interface QueueFactoryOptions<T, R> {
  readonly concurrency?: number;

  readonly process: (task: T) => Promise<R> | never;
  readonly onSucceed?: (task: T, result: R) => Promise<void>;
  readonly onFailed?: (task: T, err: unknown) => Promise<void>;
}

export type Result = Array<[Repository, Owner | null]>;
