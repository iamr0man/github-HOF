import { httpStatusCodes } from '../httpStatusCodes';
import { BaseError } from './baseError';

class NotFoundError extends BaseError {
  constructor(
    name: string,
    statusCode = httpStatusCodes.NOT_FOUND,
    description = 'Repositories for this language not found.',
  ) {
    super(name, statusCode, description);
  }
}

export { NotFoundError };
