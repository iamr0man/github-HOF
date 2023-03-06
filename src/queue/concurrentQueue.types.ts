import { Owner, Repository, RepositoryResponse } from '../result.types';

export enum TaskName {
  GET_REPOSITORIES = 'GET_REPOSITORIES',
  GET_OWNER = 'GET_OWNER',
}

export enum TaskNameError {
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
}

export enum Status {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export type RepositoryError = {
  name: TaskNameError.RATE_LIMIT_ERROR;
};

export type OwnerError = {
  name: TaskNameError.RATE_LIMIT_ERROR;
};

export interface TaskRepositorySuccess {
  name: TaskName.GET_REPOSITORIES;
  status: Status.SUCCESS;
  result: RepositoryResponse;
}

export interface TaskRepositoryError {
  name: TaskName.GET_REPOSITORIES;
  status: Status.ERROR;
  result: RepositoryError;
}

export type TaskRepository = TaskRepositorySuccess | TaskRepositoryError;

export interface TaskOwnerSuccess {
  name: TaskName.GET_OWNER;
  status: Status.SUCCESS;
  result: [Repository, Owner];
}

export interface TaskOwnerError {
  name: TaskName.GET_OWNER;
  status: Status.ERROR;
  result: OwnerError;
}

export type TaskOwner = TaskOwnerSuccess | TaskOwnerError;

export type TaskResult = TaskOwner | TaskRepository;

export type Task = TaskProcessRepositories | TaskProcessOwner;

export interface TaskProcessRepositories {
  readonly name: TaskName.GET_REPOSITORIES;
}

export interface TaskProcessOwner {
  readonly name: TaskName.GET_OWNER;
  readonly data: Repository;
}

export interface Queue<T, R> {
  readonly onProcess: (cb: ProcessCb<T, R>) => void;
  readonly onSucceed: (cb: SuccessCb<T, R>) => void;
  readonly onFail: (cb: FailCb<T>) => void;

  readonly start: () => Promise<void[]>;
  readonly add: (task: T) => void;
  readonly clear: () => void;
}

export interface QueueFactoryOptions {
  readonly concurrency?: number;
}

export type ProcessCb<T, R> = (task: T) => Promise<R>;
export type SuccessCb<T, R> = (task: T, result: R) => void;
export type FailCb<T> = (task: T, err: unknown) => Promise<void>;

export type Result = Array<[Repository, Owner | null]>;

export interface StateResult {
  result: Result;
  pagination: {
    pages: number;
    currentPage: number;
    perPage: number;
  };
}
