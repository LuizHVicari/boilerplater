import { Injectable } from "@nestjs/common";
import { UserCommandRepository } from "../ports/user-command-repo.port";
import { UserModel } from "../../domain/models/user.model";
import { usersTable } from "src/db/schema";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { UserModelSchemaMapper } from "./user-model-schema-mapper";

@Injectable()
export class UserCommandDrizzleRepo implements UserCommandRepository {
  private readonly mapper = new UserModelSchemaMapper();

  constructor(private readonly db: PostgresJsDatabase) {}

  async createUser(user: UserModel): Promise<UserModel> {
    const newUser = this.mapper.model2DB(user);
    const [createdUser] = await this.db.insert(usersTable).values(newUser).returning();

    if (!createdUser) {
      throw new Error("User not created");
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
      throw new Error("User not updated");
    }

    return this.mapper.dB2Model(savedUser);
  }

  async deleteUser(userId: string): Promise<void> {
    const deletedUsers = await this.db
      .delete(usersTable)
      .where(eq(usersTable.id, userId))
      .returning({ deletedId: usersTable.id });
    if (deletedUsers.length === 0) {
      throw new Error("User not found");
    }
  }
}
