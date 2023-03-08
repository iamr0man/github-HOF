import { getOwnerRequest } from '../api';
import { RATE_LIMIT_HEADER } from '../constants';
import { Status, TaskName, TaskNameError, TaskResult } from './concurrentQueue.types';
import { Repository } from '../result.types';

export async function ownerTaskProcess(repository: Repository): Promise<TaskResult> {
  const response = await getOwnerRequest(repository?.owner.login);

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
    result: [repository, response.data],
  };
}
