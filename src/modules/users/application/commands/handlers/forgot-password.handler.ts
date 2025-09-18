import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import {
  EMAIL_SERVICE,
  type EmailService,
} from "src/modules/common/application/ports/email.service";

import { EMAIL_CONFIG_SERVICE, type EmailConfigService } from "../../ports/email-config.service";
import { TOKEN_SERVICE, type TokenService } from "../../ports/token.service";
import {
  TOKEN_INVALIDATION_REPOSITORY,
  type TokenInvalidationRepository,
} from "../../ports/token-invalidation-repo.service";
import {
  USER_QUERY_REPOSITORY,
  type UserQueryRepository,
} from "../../ports/user-query-repo.service";
import { ForgotPasswordCommand, ForgotPasswordCommandResponse } from "../forgot-password.command";

@CommandHandler(ForgotPasswordCommand)
export class ForgotPasswordHandler implements ICommandHandler<ForgotPasswordCommand> {
  constructor(
    @Inject(EMAIL_SERVICE)
    private readonly emailService: EmailService,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
    @Inject(TOKEN_INVALIDATION_REPOSITORY)
    private readonly tokenInvalidationRepo: TokenInvalidationRepository,
    @Inject(USER_QUERY_REPOSITORY)
    private readonly userQueryRepo: UserQueryRepository,
    @Inject(EMAIL_CONFIG_SERVICE)
    private readonly emailConfigService: EmailConfigService,
  ) {}

  async execute({ email }: ForgotPasswordCommand): Promise<ForgotPasswordCommandResponse> {
    const user = await this.userQueryRepo.findUserByEmail(email);
    if (!user) {
      return { email };
    }

    await this.tokenInvalidationRepo.invalidateAllUserTokens(user.id, "password-recovery");
    const newToken = await this.tokenService.generateToken(user, "password-recovery");

    await this.emailService.sendEmail({
      email,
      subject: "Reset your password",
      template: "reset-password",
      context: {
        appName: this.emailConfigService.appName,
        userName: user.firstName ?? user.email,
        resetUrl: `${this.emailConfigService.baseUrl}${this.emailConfigService.resetPasswordPath}?token=${newToken}`,
        expirationTime: "1 day",
        supportEmail: this.emailConfigService.supportEmail,
      },
    });

    return { email };
  }
}
