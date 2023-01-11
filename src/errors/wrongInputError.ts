import { httpStatusCodes } from '../httpStatusCodes';
import { BaseError } from './baseError';

class WrongInputError extends BaseError {
  constructor(
    name: string,
    statusCode = httpStatusCodes.BAD_REQUEST,
    description = 'Wrong input type for language parameter.',
  ) {
    super(name, statusCode, description);
  }
}

export { WrongInputError };
