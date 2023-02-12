import { WrongInputError } from '../errors/wrongInputError';
import { logError } from '../logger';
import { EmptyInputError } from '../errors/emptyInputError';
import { MaxLengthError } from '../errors/maxLengthError';

const MAX_LANGUAGE_LENGTH = 100;

export const validate = (language: string | undefined) => {
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
  if (language.length > MAX_LANGUAGE_LENGTH) {
    const error = new MaxLengthError('Max length overcome');
    logError(error);
    return Promise.reject(error);
  }
  return Promise.resolve(true);
};
