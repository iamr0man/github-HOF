import { RATE_LIMIT_HEADER } from '../constants';
import { getRepositoriesRequest } from '../api';
import { TaskName, TaskRepositoryError, TaskRepositorySuccess } from './concurrentQueue.types';
import { createRateLimitError, createTaskResult } from './handleRequests';

export async function repositoryTaskProcess(language: string, currentPage: number, perPage: number) {
  const response = await getRepositoriesRequest({ language, page: currentPage, perPage });

  const remainingRateLimit = response.headers[RATE_LIMIT_HEADER];
  if (Number(remainingRateLimit) === 0) {
    return createRateLimitError<TaskRepositoryError>(TaskName.GET_REPOSITORIES);
  }
  return createTaskResult<TaskRepositorySuccess>(TaskName.GET_REPOSITORIES, response.data);
}
