import * as dotenv from 'dotenv';
dotenv.config();

import { logError, logSuccess } from './logger';

import { validate } from './validation';
import { handleRepositoriesByQueue } from './queue/handleRequests';
import { Result } from './queue/concurrentQueue.types';

export async function getRepositories(
  language: string | undefined,
): Promise<Result> {
  validate(language);

  return handleRepositoriesByQueue(language as string);
}

getRepositories('javascript')
  .then((res) => logSuccess(res))
  .catch((err) => logError(err));
