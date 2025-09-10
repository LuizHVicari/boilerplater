import { UserModel } from "../../domain/models/user.model";

export const USER_COMMAND_REPOSITORY = Symbol("USER_COMMAND_REPO");

export interface UserCommandRepository {
  createUser(user: UserModel): Promise<UserModel>;
  updateUser(user: UserModel): Promise<UserModel>;
  deleteUser(userId: string): Promise<void>;
}
