import { Task, TaskName, TaskResult } from './concurrentQueue.types';
import { repositoryTaskProcess } from './repositoryTaskProcess';
import { ownerTaskProcess } from './ownerTaskProcess';
import { assertUnreachable } from '../utils';

interface RepositoryTaskProcess {
  language: string;
  currentPage: number;
  perPage: number;
}

type PropsCallback = () => RepositoryTaskProcess;

export function createTaskProcess(fn: PropsCallback) {
  const getRepositoriesTask = async () => {
    const { language, currentPage, perPage } = fn();
    return repositoryTaskProcess(language, currentPage, perPage);
  };

  return (task: Task): Promise<TaskResult> => {
    console.log('Handle task', task);

    if (!task) {
      return Promise.reject('Empty task');
    }

    switch (task.name) {
      case TaskName.GET_REPOSITORIES:
        return getRepositoriesTask();
      case TaskName.GET_OWNER:
        return ownerTaskProcess(task.data);
      default:
        // @TODO: add in guard to fix TS error
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        assertUnreachable(task.name);
    }
  };
}
