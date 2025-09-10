import { Injectable } from "@nestjs/common";
import { RepositoryContext, UnitOfWork } from "../ports/unit-of-work.service";
import { UserCommandDrizzleRepo } from "src/users/application/adapters/user-command-drizzle-repo.service";
import { db } from "src/db";

@Injectable()
export class DrizzleUnitOfWork implements UnitOfWork {
  execute<T>(work: (ctx: RepositoryContext) => Promise<T>): Promise<T> {
    return db.transaction(async (tx): Promise<T> => {
      const ctx: RepositoryContext = {
        userCommandRepository: new UserCommandDrizzleRepo(tx),
        cancel: () => {
          return tx.rollback();
        },
      };

      return await work(ctx);
    });
  }
}
