import {
  AlreadyProcessedError,
  EntityAlreadyExistsError,
  EntityNotFoundError,
} from "@shared/errors/domain-errors";

export class UserNotFoundError extends EntityNotFoundError {}

export class UserAlreadyExistsError extends EntityAlreadyExistsError {}

export class EmailAlreadyConfirmedError extends AlreadyProcessedError {}
