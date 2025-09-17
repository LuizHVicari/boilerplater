import { DomainError } from "./domain-error.base";

const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
} as const;

export class EntityNotFoundError extends DomainError {
  readonly code = HTTP_STATUS.NOT_FOUND;
  readonly message = "Entity not found";
}

export class EntityAlreadyExistsError extends DomainError {
  readonly code = HTTP_STATUS.CONFLICT;
  readonly message = "Entity already exists";
}

export class InvalidTokenError extends DomainError {
  readonly code = HTTP_STATUS.UNAUTHORIZED;
  readonly message = "Invalid token";
}

export class TokenInvalidatedError extends DomainError {
  readonly code = HTTP_STATUS.UNAUTHORIZED;
  readonly message = "Token has been invalidated";
}

export class ValidationError extends DomainError {
  readonly code = HTTP_STATUS.BAD_REQUEST;
  readonly message = "Validation failed";
}

export class AlreadyProcessedError extends DomainError {
  readonly code = HTTP_STATUS.CONFLICT;
  readonly message = "Already processed";
}

export class InvalidStateError extends DomainError {
  readonly code = HTTP_STATUS.CONFLICT;
  readonly message = "Invalid state";
}

export class InvalidCredentialsError extends DomainError {
  readonly code = HTTP_STATUS.UNAUTHORIZED;
  readonly message = "Invalid credentials";
}
