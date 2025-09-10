import { UserModel } from "src/modules/users/domain/models/user.model";

export const USER_QUERY_REPOSITORY = Symbol("USER_QUERY_REPO");

export interface ListUserProps {
  limit: number;
  offset: number;
  search: string;
  firstName: string;
  lastName: string;
  email: string;
  active: boolean;
  emailConfirmed: boolean;
  invitedById: string;
  createdAtGte: Date;
  createdAtLte: Date;
  updatedAtGte: Date;
  updatedAtLte: Date;
}

export interface UserQueryRepository {
  findUserById(userId: string): Promise<UserModel | undefined>;
  findUserByEmail(email: string): Promise<UserModel | undefined>;
  findUsers(props: Partial<ListUserProps>): Promise<{ data: UserModel[]; count: number }>;
}
