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
import { assertUnreachable } from '../utils';
import { createQueue } from './newConcurrentQueue';
import { MAX_REPO_PER_PAGE } from '../constants';
import { usePagination } from '../utils/pagination';
import { createTaskProcess } from './taskProcess';

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

export async function handleRepositoriesByQueue(language: string, repositoryLength: number): Promise<Result> {
  let state: StateResult = {
    pagination: {
      pages: 0,
      currentPage: 0,
      perPage: 0,
    },
    result: [],
  };

  const setPages = (pages: number) => {
    state = {
      ...state,
      pagination: {
        ...state.pagination,
        pages,
      },
    };
  };

  const setCurrentPage = (currentPage: number) => {
    state = {
      ...state,
      pagination: {
        ...state.pagination,
        currentPage,
      },
    };
  };

  const setPerPage = (perPage: number) => {
    state = {
      ...state,
      pagination: {
        ...state.pagination,
        perPage,
      },
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

  const handleCurrentPage = () => {
    const { perPage, currentPage: newPage } = usePagination(state.pagination.currentPage, repositoryLength);

    setCurrentPage(newPage);
    setPerPage(perPage);
  };

  const getRepositoryTaskProps = () => {
    handleCurrentPage();

    return {
      language,
      currentPage: state.pagination.currentPage,
      perPage: state.pagination.perPage,
    };
  };

  const queue = createQueue<Task, TaskResult>(initialState, {
    process: createTaskProcess(getRepositoryTaskProps),
    onSucceed,
    onFailed,
  });

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

      const { result, pagination } = state;

      const repositoriesFetched =
        result.length / pagination.currentPage === MAX_REPO_PER_PAGE && pages > pagination.currentPage;

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
