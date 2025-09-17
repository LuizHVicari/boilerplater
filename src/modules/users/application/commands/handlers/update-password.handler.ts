import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import {
  UNIT_OF_WORK,
  type UnitOfWork,
} from "src/modules/common/application/ports/unit-of-work.service";
import { UserNotFoundError } from "src/modules/users/domain/errors/user.errors";
import { InvalidCredentialsError, InvalidStateError } from "src/shared/errors/domain-errors";

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
import { UpdatePasswordCommand, UpdatePasswordCommandResponse } from "../update-password.command";

@CommandHandler(UpdatePasswordCommand)
export class UpdatePasswordHandler implements ICommandHandler<UpdatePasswordCommand> {
  constructor(
    @Inject(USER_QUERY_REPOSITORY)
    private readonly userQueryRepository: UserQueryRepository,
    @Inject(PASSWORD_SERVICE)
    private readonly passwordService: PasswordService,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: UnitOfWork,
    @Inject(TOKEN_INVALIDATION_REPOSITORY)
    private readonly tokenInvalidationRepository: TokenInvalidationRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}
  async execute({
    userId,
    currentPassword,
    newPassword,
    invalidateSessions,
  }: UpdatePasswordCommand): Promise<UpdatePasswordCommandResponse> {
    const user = await this.userQueryRepository.findUserById(userId);
    if (!user) {
      throw new UserNotFoundError();
    }
    if (!user.canAuthenticate()) {
      throw new InvalidStateError();
    }

    const isPasswordValid = await this.passwordService.verifyPassword(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const newPasswordHash = await this.passwordService.hashPassword(newPassword);
    user.updatePassword(newPasswordHash);

    const tokens = await this.unitOfWork.execute(async ctx => {
      await ctx.userCommandRepository.updateUser(user);
      if (invalidateSessions) {
        await this.tokenInvalidationRepository.invalidateAllUserTokens(userId);
      }
      const [accessToken, refreshToken] = await Promise.all([
        this.tokenService.generateToken(user, "access"),
        this.tokenService.generateToken(user, "refresh"),
      ]);
      return { accessToken, refreshToken };
    });
    return { ...tokens, email: user.email };
  }
}
