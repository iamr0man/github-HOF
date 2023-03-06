import { RATE_LIMIT_HEADER } from '../constants';
import { getRepositoriesRequest } from '../api';
import { Status, TaskName, TaskNameError, TaskResult } from './concurrentQueue.types';

export async function repositoryTaskProcess(
  language: string,
  currentPage: number,
  perPage: number,
): Promise<TaskResult> {
  const response = await getRepositoriesRequest({
    language,
    page: currentPage,
    perPage,
  });

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
}
