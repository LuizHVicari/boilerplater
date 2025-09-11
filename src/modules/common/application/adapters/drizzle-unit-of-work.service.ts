import { Injectable } from "@nestjs/common";
import { db } from "src/db";
import { UserCommandDrizzleRepo } from "src/modules/users/application/adapters/user-command-drizzle-repo.service";

import { RepositoryContext, UnitOfWork } from "../ports/unit-of-work.service";

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
