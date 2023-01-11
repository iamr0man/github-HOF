import { httpStatusCodes } from '../httpStatusCodes';
import { BaseError } from './baseError';

class EmptyInputError extends BaseError {
  constructor(
    name: string,
    statusCode = httpStatusCodes.BAD_REQUEST,
    description = 'You passed empty language parameter. Please input minimum 1 symbol.',
  ) {
    super(name, statusCode, description);
  }
}

export { EmptyInputError };
