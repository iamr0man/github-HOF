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
  result: Owner;
}

export interface TaskOwnerError {
  name: TaskName.GET_OWNER;
  status: Status.ERROR;
  result: OwnerError;
}

export type TaskOwner = TaskOwnerSuccess | TaskOwnerError;

export type TaskResult = TaskOwner | TaskRepository;

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

  readonly process: (task: T) => Promise<R>;
  readonly onSucceed?: (task: T, result: R) => Promise<void>;
  readonly onFailed?: (task: T, err: unknown) => Promise<void>;
}

export type Result = Array<[Repository, Owner | null]>;
