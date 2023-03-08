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

type Events = {
  onError: () => {};
  onRepositoryComlete: () => {}
  onOwnerComplete: () => {};
  onRequestRepository: () => {}
}

type Queue = {
  clear: () => {};
  onAddOwner: () => {};
  onAddRepository: () => {};
}

type StateService = {
  addOwner: () => {};
  getNextPage: () => number | undefined;
}

export const createTaskSucceed = (events: Events, state: StateService) => {
  const repositoryTaskFn = (value: TaskRepository) => {
    if (value.status === Status.ERROR) {
      events.onError()
      return;
    }

    const repositories = value.result.items;

    repositories.forEach((repository) => {
      events.onRepositoryComlete(repository)
    });
  };

  const ownerTaskFn = (value: TaskOwner) => {
    if (value.status === Status.ERROR) {
      queue.clear();
      return;
    }

    state.addOwner(value.result);
    const nextPage = state.getNextPage();

    if (nextPage !== undefined) {
      events.onRequestRepository(nextPage)
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
