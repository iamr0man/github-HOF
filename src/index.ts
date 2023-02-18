import * as dotenv from 'dotenv';
dotenv.config();

import { logError, logSuccess } from './logger';

import { validate } from './validation';
import { handleRepositoriesByQueue } from './queue/handleRequests';
import { Result } from './queue/concurrentQueue.types';

export async function getRepositories(language: string | undefined, repositoryLength: number): Promise<Result> {
  validate(language);

  return handleRepositoriesByQueue(language as string, repositoryLength);
}

getRepositories('javascript', 4)
  .then((res) => logSuccess(res))
  .catch((err) => logError(err));
