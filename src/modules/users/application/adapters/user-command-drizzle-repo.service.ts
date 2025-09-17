import { Inject, Injectable } from "@nestjs/common";
import { ValidationError } from "@shared/errors/domain-errors";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DB_TOKEN } from "src/db";
import { usersTable } from "src/db/schema";
import { UserNotFoundError } from "src/modules/users/domain/errors/user.errors";

import { UserModel } from "../../domain/models/user.model";
import { UserCommandRepository } from "../ports/user-command-repo.service";
import { UserModelSchemaMapper } from "./user-model-schema.mapper";

@Injectable()
export class UserCommandDrizzleRepo implements UserCommandRepository {
  private readonly mapper = new UserModelSchemaMapper();

  constructor(
    @Inject(DB_TOKEN)
    private readonly db: NodePgDatabase,
  ) {}

  async createUser(user: UserModel): Promise<UserModel> {
    const newUser = this.mapper.model2DB(user);
    const [createdUser] = await this.db.insert(usersTable).values(newUser).returning();

    if (!createdUser) {
      throw new ValidationError();
    }

    return this.mapper.dB2Model(createdUser);
  }

  async updateUser(user: UserModel): Promise<UserModel> {
    const updatedUser = this.mapper.model2DB(user);
    const [savedUser] = await this.db
      .update(usersTable)
      .set(updatedUser)
      .where(eq(usersTable.id, user.id))
      .returning();

    if (!savedUser) {
      throw new UserNotFoundError();
    }

    return this.mapper.dB2Model(savedUser);
  }

  async deleteUser(userId: string): Promise<void> {
    const deletedUsers = await this.db
      .delete(usersTable)
      .where(eq(usersTable.id, userId))
      .returning({ deletedId: usersTable.id });
    if (deletedUsers.length === 0) {
      throw new UserNotFoundError();
    }
  }
}
