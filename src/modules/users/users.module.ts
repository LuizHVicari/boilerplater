import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import cookiesConfig from "../common/config/cookies.config";
import { BcryptPasswordService } from "./application/adapters/bcrypt-password.service";
import { CacheTokenInvalidationRepoService } from "./application/adapters/cache-token-invalidation-repo.service";
import { JWTTokenService } from "./application/adapters/jwt-token.service";
import { NestJSEmailConfigService } from "./application/adapters/nestjs-email-config.service";
import { UserQueryDrizzleRepository } from "./application/adapters/user-query-drizzle-repo.service";
import { ConfirmEmailHandler } from "./application/commands/handlers/confirm-email.handler";
import { ForgotPasswordHandler } from "./application/commands/handlers/forgot-password.handler";
import { RefreshTokenHandler } from "./application/commands/handlers/refresh-token.handler";
import { ResendEmailConfirmationHandler } from "./application/commands/handlers/resend-email-confirmation.handler";
import { ResetPasswordHandler } from "./application/commands/handlers/reset-password.handler";
import { SignInHandler } from "./application/commands/handlers/sign-in.handler";
import { SignOutHandler } from "./application/commands/handlers/sign-out.handler";
import { SignUpHandler } from "./application/commands/handlers/sign-up.handler";
import { UpdatePasswordHandler } from "./application/commands/handlers/update-password.handler";
import { EMAIL_CONFIG_SERVICE } from "./application/ports/email-config.service";
import { PASSWORD_SERVICE } from "./application/ports/password.service";
import { TOKEN_SERVICE } from "./application/ports/token.service";
import { TOKEN_INVALIDATION_REPOSITORY } from "./application/ports/token-invalidation-repo.service";
import { USER_QUERY_REPOSITORY } from "./application/ports/user-query-repo.service";
import { AuthValidationService } from "./application/services/auth-validation.service";
import { JwtStrategy } from "./application/strategies/jwt.strategy";
import { LocalStrategy } from "./application/strategies/local.strategy";
import emailConfig from "./config/email.config";
import jwtConfig from "./config/jwt.config";
import { AuthResolver } from "./presentation/graphql/resolvers/auth.resolver";

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(emailConfig),
    ConfigModule.forFeature(cookiesConfig),
    JwtModule.register({}),
    PassportModule,
  ],
  providers: [
    JwtStrategy,
    LocalStrategy,
    AuthValidationService,
    { provide: TOKEN_SERVICE, useClass: JWTTokenService },
    { provide: USER_QUERY_REPOSITORY, useClass: UserQueryDrizzleRepository },
    { provide: TOKEN_INVALIDATION_REPOSITORY, useClass: CacheTokenInvalidationRepoService },
    { provide: PASSWORD_SERVICE, useClass: BcryptPasswordService },
    { provide: EMAIL_CONFIG_SERVICE, useClass: NestJSEmailConfigService },
    AuthResolver,
    SignUpHandler,
    SignInHandler,
    SignOutHandler,
    RefreshTokenHandler,
    ConfirmEmailHandler,
    ResendEmailConfirmationHandler,
    ForgotPasswordHandler,
    ResetPasswordHandler,
    UpdatePasswordHandler,
  ],
})
export class UsersModule {}
