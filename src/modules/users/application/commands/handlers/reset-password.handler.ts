import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from "src/modules/common/application/ports/unit-of-work.service";
import { UserNotFoundError } from "src/modules/users/domain/errors/user.errors";
import { AuthToken } from "src/modules/users/domain/value-objects/auth-token.vo";
import { InvalidStateError, InvalidTokenError } from "src/shared/errors/domain-errors";

import { PASSWORD_SERVICE, type PasswordService } from "../../ports/password.service";
import { TOKEN_SERVICE, type TokenService } from "../../ports/token.service";
import {
  TOKEN_INVALIDATION_REPOSITORY,
  type TokenInvalidationRepository,
} from "../../ports/token-invalidation-repo.service";
import {
  USER_QUERY_REPOSITORY,
  type UserQueryRepository,
} from "../../ports/user-query-repo.service";
import { ResetPasswordCommand, ResetPasswordCommandResponse } from "../reset-password.command";

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand> {
  constructor(
    @Inject(PASSWORD_SERVICE)
    private readonly passwordService: PasswordService,
    @Inject(USER_QUERY_REPOSITORY)
    private readonly userQueryRepo: UserQueryRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: UnitOfWork,
    @Inject(TOKEN_INVALIDATION_REPOSITORY)
    private readonly tokenInvalidationRepo: TokenInvalidationRepository,
  ) {}
  async execute({ password, token }: ResetPasswordCommand): Promise<ResetPasswordCommandResponse> {
    const tokenPayload = await this.verifyToken(token);
    const [user, isTokenValid] = await Promise.all([
      this.userQueryRepo.findUserById(tokenPayload.sub),
      this.tokenInvalidationRepo.verifyTokenValid(tokenPayload),
    ]);
    if (!user) {
      throw new UserNotFoundError();
    }
    if (!isTokenValid) {
      throw new InvalidTokenError();
    }
    if (!user.canAuthenticate()) {
      throw new InvalidStateError();
    }
    const newPassword = await this.passwordService.hashPassword(password);
    user.updatePassword(newPassword);
    await this.unitOfWork.execute(async ctx => {
      await ctx.userCommandRepository.updateUser(user);
    });
    return {
      email: user.email,
    };
  }

  async verifyToken(token: string): Promise<AuthToken> {
    try {
      const tokenPayload = await this.tokenService.verifyToken(token);
      if (tokenPayload.type !== "password-recovery") {
        throw new InvalidTokenError();
      }
      return tokenPayload;
    } catch {
      throw new InvalidTokenError();
    }
  }
}
