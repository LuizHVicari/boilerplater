import { Inject, Injectable } from "@nestjs/common";
import { InvalidCredentialsError } from "src/shared/errors/domain-errors";
import { millisecondsToSeconds } from "src/shared/utils/time";

import { UserModel } from "../../domain/models/user.model";
import { AuthToken } from "../../domain/value-objects/auth-token.vo";
import {
  TOKEN_INVALIDATION_REPOSITORY,
  type TokenInvalidationRepository,
} from "../ports/token-invalidation-repo.service";
import { USER_QUERY_REPOSITORY, type UserQueryRepository } from "../ports/user-query-repo.service";

@Injectable()
export class AuthValidationService {
  constructor(
    @Inject(USER_QUERY_REPOSITORY)
    private readonly userQueryRepo: UserQueryRepository,
    @Inject(TOKEN_INVALIDATION_REPOSITORY)
    private readonly tokenInvalidationRepo: TokenInvalidationRepository,
  ) {}

  async validateAuthToken(authToken: AuthToken): Promise<UserModel> {
    if (!authToken.isValidForAuthentication()) {
      throw new InvalidCredentialsError();
    }
    const user = await this.userQueryRepo.findUserById(authToken.sub);
    if (!user) {
      throw new InvalidCredentialsError();
    }
    if (!user.canAuthenticate()) {
      throw new InvalidCredentialsError();
    }
    if (
      user.lastCredentialInvalidation &&
      millisecondsToSeconds(user.lastCredentialInvalidation.getTime()) > authToken.iat
    ) {
      throw new InvalidCredentialsError();
    }

    await this.tokenInvalidationRepo.verifyTokenValid(authToken);
    return user;
  }
}
