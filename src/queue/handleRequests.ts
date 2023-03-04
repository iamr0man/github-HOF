import {
  Result,
  StateResult,
  Status,
  Task,
  TaskName,
  TaskOwner,
  TaskRepository,
  TaskResult,
} from './concurrentQueue.types';
import { Repository } from '../result.types';
import { assertUnreachable } from '../utils';
import { createQueue } from './newConcurrentQueue';
import { MAX_REPO_PER_PAGE } from '../constants';
import { usePagination } from '../utils/pagination';
import { repositoryTaskProcess } from './repositoryTaskProcess';
import { ownerTaskProcess } from './ownerTaskProcess';

const createInitialState = (totalRepositories: number) => {
  if (totalRepositories < 1) {
    throw Error('There is repositories to fetch');
  }

  const initialState: Task[] = [];

  initialState.push({
    name: TaskName.GET_REPOSITORIES,
  });

  const pages = Math.round(totalRepositories / MAX_REPO_PER_PAGE);
  return {
    initialState,
    pages,
  };
};

export async function handleRepositoriesByQueue(
  language: string,
  repositoryLength: number,
): Promise<Result> {
  let state: StateResult = {
    pages: 0,
    result: [],
    currentPage: 0,
  };

  const setPages = (pages: number) => {
    state = {
      ...state,
      pages,
    };
  };

  const setCurrentPage = (currentPage: number) => {
    state = {
      ...state,
      currentPage,
    };
  };

  const setResult = (result: Result) => {
    state = {
      ...state,
      result,
    };
  };

  const { initialState, pages } = createInitialState(repositoryLength);

  setPages(pages);

  const queue = createQueue<Task, TaskResult>(initialState, {
    process,
    onSucceed,
    onFailed,
  });

  const getRepositoriesTask = async () => {
    const { perPage, currentPage: newPage } = usePagination(
      state.currentPage,
      repositoryLength,
    );
    setCurrentPage(newPage);

    return repositoryTaskProcess(language, state.currentPage, perPage);
  };

  const getOwnerTask = async (repository: Repository) => {
    return ownerTaskProcess(repository);
  };

  function process(task: Task): Promise<TaskResult> {
    console.log('Handle task', task);

    if (!task) {
      return Promise.reject('Empty task');
    }

    switch (task.name) {
      case TaskName.GET_REPOSITORIES:
        return getRepositoriesTask();
      case TaskName.GET_OWNER:
        return getOwnerTask(task.data);
      default:
        // @TODO: add in guard to fix TS error
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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

      const repositories = value.result.items;
      repositories.forEach((repository) => {
        queue.add({
          name: TaskName.GET_OWNER,
          data: repository,
        });
      });
    };

    const ownerTaskFn = (value: TaskOwner) => {
      if (value.status === Status.ERROR) {
        queue.clear();
        return;
      }

      setResult([...state.result, value.result]);

      const { result, currentPage, pages } = state;

      const repositoriesFetched =
        result.length / currentPage === MAX_REPO_PER_PAGE &&
        pages > currentPage;

      if (repositoriesFetched) {
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
        // @TODO: add in guard to fix TS error
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

  return queue.start().then(() => state.result);
}
