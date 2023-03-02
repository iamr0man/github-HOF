import { getOwnerRequest } from '../api';
import { RATE_LIMIT_HEADER } from '../constants';
import { TaskName, TaskOwnerError, TaskOwnerSuccess } from './concurrentQueue.types';
import { createRateLimitError, createTaskResult } from './handleRequests';
import { Repository } from '../result.types';

export async function ownerTaskProcess(repository: Repository) {
  const response = await getOwnerRequest(repository?.owner.login);

  const remainingRateLimit = response.headers[RATE_LIMIT_HEADER];

  if (Number(remainingRateLimit) === 0) {
    return createRateLimitError<TaskOwnerError>(TaskName.GET_OWNER);
  }

  return createTaskResult<TaskOwnerSuccess>(TaskName.GET_OWNER, response.data);
}
