import { DBNewUser, DBUser } from "src/db/schema";
import { UserModel } from "src/modules/users/domain/models/user.model";

export class UserModelSchemaMapper {
  model2DB(user: UserModel): DBNewUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: user.password,
      active: user.active,
      emailConfirmed: user.emailConfirmed,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      invitedById: user.invitedById,
      lastCredentialInvalidation: user.lastCredentialInvalidation,
    };
  }

  dB2Model(user: DBUser): UserModel {
    return new UserModel({
      id: user.id,
      email: user.email,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      password: user.password,
      active: user.active,
      emailConfirmed: user.emailConfirmed ?? undefined,
      createdAt: user.createdAt ?? undefined,
      updatedAt: user.updatedAt ?? undefined,
      invitedById: user.invitedById ?? undefined,
      lastCredentialInvalidation: user.lastCredentialInvalidation ?? undefined,
    });
  }
}
