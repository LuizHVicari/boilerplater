import { UNIT_OF_WORK, type UnitOfWork } from "@common/application/ports/unit-of-work.service";
import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { TOKEN_SERVICE, type TokenService } from "../../ports/token.service";
import {
  TOKEN_INVALIDATION_REPOSITORY,
  type TokenInvalidationRepository,
} from "../../ports/token-invalidation-repo.service";
import {
  USER_QUERY_REPOSITORY,
  type UserQueryRepository,
} from "../../ports/user-query-repo.service";
import { ConfirmEmailCommand, type ConfirmEmailCommandResponse } from "../confirm-email.command";

@CommandHandler(ConfirmEmailCommand)
export class ConfirmEmailHandler implements ICommandHandler<ConfirmEmailCommand> {
  constructor(
    @Inject(TOKEN_INVALIDATION_REPOSITORY)
    private readonly tokenInvalidationRepo: TokenInvalidationRepository,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: UnitOfWork,
    @Inject(USER_QUERY_REPOSITORY)
    private readonly userQueryRepo: UserQueryRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute({ token }: ConfirmEmailCommand): Promise<ConfirmEmailCommandResponse> {
    const tokenPayload = await this.tokenService.verifyToken(token);
    if (tokenPayload.type !== "email-confirmation") {
      throw new Error("Invalid token");
    }

    const isTokenValid = await this.tokenInvalidationRepo.verifyTokenValid(tokenPayload);

    if (!isTokenValid) {
      throw new Error("Token has been invalidated");
    }

    const { sub } = tokenPayload;
    const user = await this.userQueryRepo.findUserById(sub);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.emailConfirmed) {
      throw new Error("Email already confirmed");
    }

    user.confirmEmail();

    await this.unitOfWork.execute(async ctx => {
      await ctx.userCommandRepository.updateUser(user);
    });

    return {
      email: user.email,
      id: user.id,
    };
  }
}
