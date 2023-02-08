import {
  Result,
  Task,
  TaskName,
  TaskOwner,
  TaskRepository,
  TaskResult,
} from './concurrentQueue.types';
import { Owner, Repository } from '../result.types';
import {
  getOwnerRequest,
  getRateLimitRequest,
  getRepositoriesRequest,
} from '../api';
import { assertUnreachable } from '../utils';
import { createQueue } from './newConcurrentQueue';

export async function handleRepositoriesByQueue(
  language: string,
): Promise<Result> {
  const initialState: Task[] = [];
  let ownerArray: Owner[] = [];
  let repositoryArray: Repository[] = [];
  let result: Result = [];

  initialState.push({
    name: TaskName.GET_REPOSITORIES,
  });

  // const rateLimit = await getRateLimitRequest();

  const queue = createQueue<Task, TaskResult>(initialState, {
    process,
    onSucceed,
    onFailed,
  });

  function process(task: Task): Promise<TaskResult> {
    console.log('Handle task', task);

    if (!task) {
      return Promise.reject('');
    }

    let repository = {} as Repository;
    if (repositoryArray.length) {
      const [currentRepository, ...restRepositories] = repositoryArray;

      repository = currentRepository;
      result = [...result, [repository, {} as Owner]];
      repositoryArray = restRepositories;
    }

    switch (task.name) {
      case TaskName.GET_REPOSITORIES:
        return getRepositoriesRequest(language).then(
          (response): TaskResult => ({
            name: TaskName.GET_REPOSITORIES,
            result: response,
          }),
        );
      case TaskName.GET_OWNER:
        return getOwnerRequest(repository?.owner.login).then(
          (response): TaskResult => ({
            name: TaskName.GET_OWNER,
            result: response,
          }),
        );
      case TaskName.GET_RATE_LIMIT:
        return getRateLimitRequest().then(
          (response): TaskResult => ({
            name: TaskName.GET_RATE_LIMIT,
            result: response,
          }),
        );
      default:
        assertUnreachable(task.name);
    }
  }

  async function onSucceed(task: Task, value: TaskResult) {
    console.log('Complete', task, value);

    function isTaskRepository(
      taskResult: TaskResult,
    ): taskResult is TaskRepository {
      return taskResult.name === TaskName.GET_REPOSITORIES;
    }

    function isTaskOwner(taskResult: TaskResult): taskResult is TaskOwner {
      return taskResult.name === TaskName.GET_OWNER;
    }

    const repositoryTaskFn = (value: TaskRepository) => {
      repositoryArray = [...repositoryArray, ...value.result.items];
      value.result.items.forEach(() => {
        queue.add({
          name: TaskName.GET_OWNER,
        });
      });
    };

    const ownerTaskFn = (value: TaskOwner) => {
      ownerArray = [...ownerArray, value.result];
    };

    if (isTaskRepository(value)) {
      repositoryTaskFn(value);
    } else if (isTaskOwner(value)) {
      ownerTaskFn(value);
    } else {
      // searchRate = value.resources.search;
    }
  }

  async function onFailed(task: Task, err: unknown) {
    if (!task) {
      console.log('Empty task in thread');
      return;
    }
    console.log('Failed', err);
  }

  const formatResult = () => {
    return result.reduce((res, [repository]) => {
      const owner = ownerArray.find(
        (owner: Owner) => owner.login === repository.owner.login,
      );
      if (!owner) {
        return [...res, [repository, {} as Owner]];
      }
      return [...res, [repository, owner]];
    }, [] as Result);
  };
  return queue.start().then(formatResult);
}
