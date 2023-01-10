import * as dotenv from 'dotenv';
import { logError } from './logger';

import { WrongInputError } from './errors/wrongInputError';
import { EmptyInputError } from './errors/emptyInputError';
import { MaxLengthError } from './errors/maxLengthError';

dotenv.config();

export async function getRepositories(
  language: string | undefined,
): Promise<string | Error> {
  // validation
  if (typeof language !== 'string') {
    const error = new WrongInputError('Wrong input data');
    logError(error);
    return Promise.reject(error);
  }
  if (language.length === 0) {
    const error = new EmptyInputError('Empty input');
    logError(error);
    return Promise.reject(error);
  }
  if (language.length > 100) {
    const error = new MaxLengthError('Max length overcome');
    logError(error);
    return Promise.reject(error);
  }

  return Promise.resolve('');
}
