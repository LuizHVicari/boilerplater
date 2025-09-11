import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
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
      throw new UnauthorizedException("Invalid token type");
    }
    const user = await this.userQueryRepo.findUserById(authToken.sub);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    if (!user.canAuthenticate()) {
      throw new UnauthorizedException("Email not confirmed or user not active");
    }
    if (
      user.lastCredentialInvalidation &&
      millisecondsToSeconds(user.lastCredentialInvalidation.getTime()) > authToken.iat
    ) {
      throw new UnauthorizedException(
        "User credentials have been invalidated since this token was issued",
      );
    }

    await this.tokenInvalidationRepo.verifyTokenValid(authToken);
    return user;
  }
}
