import { UserCommandRepository } from "src/users/application/ports/user-command-repo.service";

export const UNIT_OF_WORK = Symbol("UNIT_Of_WORK");

export interface RepositoryContext {
  userCommandRepository: UserCommandRepository;
  cancel: () => Promise<void>;
}

export interface UnitOfWork {
  execute<T>(work: (ctx: RepositoryContext) => Promise<T>): Promise<T>;
}
