import { Inject, UnauthorizedException } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UserNotFoundError } from "@users/domain/errors/user.errors";

import { TOKEN_SERVICE, type TokenService } from "../../ports/token.service";
import {
  TOKEN_INVALIDATION_REPOSITORY,
  type TokenInvalidationRepository,
} from "../../ports/token-invalidation-repo.service";
import {
  USER_QUERY_REPOSITORY,
  type UserQueryRepository,
} from "../../ports/user-query-repo.service";
import { RefreshTokenCommand, RefreshTokenCommandResponse } from "../refresh-token.command";

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler implements ICommandHandler<RefreshTokenCommand> {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
    @Inject(TOKEN_INVALIDATION_REPOSITORY)
    private readonly tokenInvalidationRepository: TokenInvalidationRepository,
    @Inject(USER_QUERY_REPOSITORY)
    private readonly userQueryRepository: UserQueryRepository,
  ) {}

  async execute({ refreshToken }: RefreshTokenCommand): Promise<RefreshTokenCommandResponse> {
    const authToken = await this.tokenService.verifyToken(refreshToken);

    if (!authToken.isValidForRefresh()) {
      throw new UnauthorizedException("Invalid token type for refresh");
    }

    const isTokenValid = await this.tokenInvalidationRepository.verifyTokenValid(authToken);
    if (!isTokenValid) {
      throw new UnauthorizedException("Token has been invalidated");
    }

    const user = await this.userQueryRepository.findUserById(authToken.sub);
    if (!user) {
      throw new UserNotFoundError();
    }

    if (!user.canAuthenticate()) {
      throw new UnauthorizedException("User cannot authenticate");
    }

    const accessToken = await this.tokenService.generateToken(user, "access");

    return { accessToken };
  }
}
