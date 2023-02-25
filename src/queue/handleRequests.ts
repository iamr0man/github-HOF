import {
  Result,
  Status,
  Task,
  TaskName,
  TaskNameError,
  TaskOwner,
  TaskRepository,
  TaskResult,
} from './concurrentQueue.types';
import { Owner, Repository } from '../result.types';
import { getOwnerRequest, getRepositoriesRequest } from '../api';
import { assertUnreachable } from '../utils';
import { createQueue } from './newConcurrentQueue';
import { MAX_REPO_PER_PAGE, RATE_LIMIT_HEADER } from '../constants';

export async function handleRepositoriesByQueue(language: string, repositoryLength: number): Promise<Result> {
  const initialState: Task[] = [];
  let ownerArray: Owner[] = [];
  let repositoryArray: Repository[] = [];
  let result: Result = [];

  const pages = Math.round(repositoryLength / MAX_REPO_PER_PAGE);
  let currentPage = 0;

  const initState = () => {
    initialState.push({
      name: TaskName.GET_REPOSITORIES,
    });
  };

  if (repositoryLength) {
    initState();
  }

  const queue = createQueue<Task, TaskResult>(initialState, {
    process,
    onSucceed,
    onFailed,
  });

  function process(task: Task): Promise<TaskResult> {
    console.log('Handle task', task);

    if (!task) {
      return Promise.reject('Empty task');
    }

    const getRepositoriesTask = () => {
      currentPage++;

      let perPage = MAX_REPO_PER_PAGE;
      const isSinglePage = repositoryLength === 1;
      const isLastPage = currentPage !== 1 && currentPage === Math.round(repositoryLength / MAX_REPO_PER_PAGE);
      const isOddLength = repositoryLength % 2 > 0;

      if ((isSinglePage || isLastPage) && isOddLength) {
        perPage = repositoryLength % MAX_REPO_PER_PAGE;
      }

      return getRepositoriesRequest(language, currentPage, perPage).then((response): TaskResult => {
        const remainingRateLimit = response.headers[RATE_LIMIT_HEADER];

        if (Number(remainingRateLimit) === 0) {
          return {
            name: TaskName.GET_REPOSITORIES,
            status: Status.ERROR,
            result: {
              name: TaskNameError.RATE_LIMIT_ERROR,
            },
          };
        }
        return {
          name: TaskName.GET_REPOSITORIES,
          status: Status.SUCCESS,
          result: response.data,
        };
      });
    };

    const getOwnerTask = () => {
      let repository = {} as Repository;
      if (repositoryArray.length) {
        const [currentRepository, ...restRepositories] = repositoryArray;

        repository = currentRepository;
        result = [...result, [repository, null]];
        repositoryArray = restRepositories;
      }

      return getOwnerRequest(repository?.owner.login).then((response): TaskResult => {
        const remainingRateLimit = response.headers[RATE_LIMIT_HEADER];

        if (Number(remainingRateLimit) === 0) {
          return {
            name: TaskName.GET_OWNER,
            status: Status.ERROR,
            result: {
              name: TaskNameError.RATE_LIMIT_ERROR,
            },
          };
        }

        return {
          name: TaskName.GET_OWNER,
          status: Status.SUCCESS,
          result: response.data,
        };
      });
    };

    switch (task.name) {
      case TaskName.GET_REPOSITORIES:
        return getRepositoriesTask();
      case TaskName.GET_OWNER:
        return getOwnerTask();
      default:
        assertUnreachable(task.name);
    }
  }

  async function onSucceed(task: Task, value: TaskResult) {
    console.log('Complete', task, value);

    const repositoryTaskFn = (value: TaskRepository) => {
      if (value.status === Status.ERROR) {
        queue.clear();
        return;
      }

      const items = value.result.items;
      repositoryArray = [...repositoryArray, ...items];
      items.forEach(() => {
        queue.add({
          name: TaskName.GET_OWNER,
        });
      });
    };

    const ownerTaskFn = (value: TaskOwner) => {
      if (value.status === Status.ERROR) {
        queue.clear();
        return;
      }

      ownerArray = [...ownerArray, value.result];

      if (result.length / currentPage === MAX_REPO_PER_PAGE && pages > currentPage) {
        queue.add({
          name: TaskName.GET_REPOSITORIES,
        });
      }
    };

    switch (value.name) {
      case TaskName.GET_REPOSITORIES:
        repositoryTaskFn(value);
        break;
      case TaskName.GET_OWNER:
        ownerTaskFn(value);
        break;
      default:
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        assertUnreachable(value.name);
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
    let formattedResult: Result = [];
    result.forEach(([repository]) => {
      const owner = ownerArray.find((owner: Owner) => owner.login === repository.owner.login);
      if (!owner) {
        formattedResult = [...formattedResult, [repository, null]];
      } else {
        formattedResult = [...formattedResult, [repository, owner]];
      }
    });
    return formattedResult;
  };

  return queue.start().then(formatResult);
}
