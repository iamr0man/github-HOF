import { Queue, Result, StateResult, Task, TaskName, TaskResult } from './concurrentQueue.types';
import { createQueue } from './newConcurrentQueue';
import { MAX_REPO_PER_PAGE } from '../constants';
import { usePagination } from '../utils/pagination';
import { createTaskProcess } from './taskProcess';
import { createTaskSucceed } from './taskSucceed';

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
    onSucceed: createTaskSucceed(queue, state, setResult),
    onFailed,
  });

  // @TODO suggest fix for: Block-scoped variable 'queue' used before its declaration.
  // queue.createParams({
  //   process: createTaskProcess(getRepositoryTaskProps),
  //   onSucceed: createTaskSucceed(queue, state, setResult),
  //   onFailed,
  // });

  async function onFailed(task: Task, err: unknown) {
    if (!task) {
      console.log('Empty task in thread');
      return;
    }
    console.log('Failed', err);
  }

  return queue.start().then(() => state.result);
}
