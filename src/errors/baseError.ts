class BaseError extends Error {
  readonly name: string;
  readonly statusCode: number;
  readonly description: string;

  constructor(name: string, statusCode: number, description: string) {
    super(description);

    this.name = name;
    this.statusCode = statusCode;
    this.description = description;

    Error.captureStackTrace(this);
  }
}

export { BaseError };
