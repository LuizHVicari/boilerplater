import { EMAIL_SERVICE, type EmailService } from "@common/application/ports/email.service";
import { UNIT_OF_WORK, type UnitOfWork } from "@common/application/ports/unit-of-work.service";
import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UserModel } from "@users/domain/models/user.model";

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
import { SignUpCommand, SignUpCommandResponse } from "../sign-up.command";

@CommandHandler(SignUpCommand)
export class SignUpHandler implements ICommandHandler<SignUpCommand> {
  constructor(
    @Inject(EMAIL_SERVICE)
    private readonly emailService: EmailService,
    @Inject(TOKEN_INVALIDATION_REPOSITORY)
    private readonly tokenInvalidationRepo: TokenInvalidationRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: UnitOfWork,
    @Inject(USER_QUERY_REPOSITORY)
    private readonly userQueryRepo: UserQueryRepository,
    @Inject(PASSWORD_SERVICE)
    private readonly passwordService: PasswordService,
  ) {}

  async execute({
    email,
    password,
    firstName,
    lastName,
  }: SignUpCommand): Promise<SignUpCommandResponse> {
    return this.unitOfWork.execute(async ctx => {
      const hashedPasswordPromise = this.passwordService.hashPassword(password);
      const existingUserPromise = this.userQueryRepo.findUserByEmail(email);

      const [hashedPassword, existingUser] = await Promise.all([
        hashedPasswordPromise,
        existingUserPromise,
      ]);

      if (existingUser) {
        throw new Error("User already exists");
      }

      const user = new UserModel({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        active: true,
        emailConfirmed: false,
      });

      const createdUser = await ctx.userCommandRepository.createUser(user);

      await this.tokenInvalidationRepo.invalidateAllUserTokens(user.id, "email-confirmation");

      const token = await this.tokenService.generateToken(user, "email-confirmation");
      await this.emailService.sendEmail({
        email,
        subject: "Welcome to our platform",
        template: "email-verification",
        context: {
          appName: "My App",
          userName: user.firstName ?? user.email,
          verificationUrl: `https://example.com/verify?token=${token}`,
          expirationTime: "1 day",
          supportEmail: "Lx0dR@example.com",
        },
      });
      return createdUser;
    });
  }
}
