import { EMAIL_SERVICE, type EmailService } from "@common/application/ports/email.service";
import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import {
  EmailAlreadyConfirmedError,
  UserNotFoundError,
} from "src/modules/users/domain/errors/user-errors";
import { UserModel } from "src/modules/users/domain/models/user.model";

import { TOKEN_SERVICE, type TokenService } from "../../ports/token.service";
import {
  TOKEN_INVALIDATION_REPOSITORY,
  type TokenInvalidationRepository,
} from "../../ports/token-invalidation-repo.service";
import {
  USER_QUERY_REPOSITORY,
  type UserQueryRepository,
} from "../../ports/user-query-repo.service";
import {
  ResendEmailConfirmationCommand,
  ResendEmailConfirmationCommandResponse,
} from "../resend-email-confirmation.command";

@CommandHandler(ResendEmailConfirmationCommand)
export class ResendEmailConfirmationHandler
  implements ICommandHandler<ResendEmailConfirmationCommand>
{
  constructor(
    @Inject(USER_QUERY_REPOSITORY)
    private readonly userQueryRepo: UserQueryRepository,
    @Inject(EMAIL_SERVICE)
    private readonly emailService: EmailService,
    @Inject(TOKEN_INVALIDATION_REPOSITORY)
    private readonly tokenInvalidationRepo: TokenInvalidationRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}
  async execute({
    email,
  }: ResendEmailConfirmationCommand): Promise<ResendEmailConfirmationCommandResponse> {
    const user = await this.userQueryRepo.findUserByEmail(email);
    this.verifyUserCanResendEmailConfirmation(user);
    await this.tokenInvalidationRepo.invalidateAllUserTokens(user.id, "email-confirmation");
    const confirmEmailToken = await this.tokenService.generateToken(user, "email-confirmation");
    await this.emailService.sendEmail({
      email,
      subject: "Welcome to our platform",
      template: "email-verification",
      context: {
        appName: "My App",
        userName: user.firstName ?? user.email,
        verificationUrl: `https://example.com/verify?token=${confirmEmailToken}`,
        expirationTime: "1 day",
        supportEmail: "Lx0dR@example.com",
      },
    });
    return { email: user.email };
  }

  private verifyUserCanResendEmailConfirmation(user?: UserModel): asserts user is UserModel {
    if (!user) {
      throw new UserNotFoundError();
    }
    if (user.emailConfirmed) {
      throw new EmailAlreadyConfirmedError();
    }
  }
}
