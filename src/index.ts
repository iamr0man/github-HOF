import * as dotenv from 'dotenv';
import { logError } from './logger';
import { WrongInputData } from './errors/wrongInputData';

dotenv.config();

export async function getRepositories(
  language: string | undefined,
): Promise<string | Error> {
  const wrongTypeCheck = () => {
    if (typeof language !== 'string') {
      const error = new WrongInputData('Wrong input data');
      return Promise.reject(error);
    }
  };

  try {
    await wrongTypeCheck();
  } catch (error) {
    logError(error);
  }

  return Promise.resolve('');
}
