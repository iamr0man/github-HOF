import { httpStatusCodes } from '../httpStatusCodes';
import { BaseError } from './baseError';

class MaxLengthError extends BaseError {
  constructor(
    name: string,
    statusCode = httpStatusCodes.BAD_REQUEST,
    description = 'You passed parameter grater then 100 symbols, you overcome the limit.',
  ) {
    super(name, statusCode, description);
  }
}

export { MaxLengthError };
