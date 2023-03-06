import {
  Queue,
  Result,
  StateResult,
  Status,
  Task,
  TaskName,
  TaskOwner,
  TaskRepository,
  TaskResult,
} from './concurrentQueue.types';
import { MAX_REPO_PER_PAGE } from '../constants';
import { assertUnreachable } from '../utils';

type ResultFn = (result: Result) => void;

export const createTaskSucceed = (queue: Queue<Task>, state: StateResult, setResult: ResultFn) => {
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
      result.length / pagination.currentPage === MAX_REPO_PER_PAGE && state.pagination.pages > pagination.currentPage;

    if (repositoriesFetched) {
      queue.add({
        name: TaskName.GET_REPOSITORIES,
      });
    }
  };

  return (task: Task, value: TaskResult) => {
    console.log('Complete', task, value);

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
  };
};
