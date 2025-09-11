import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersResolver } from "./users.resolver";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule } from "@nestjs/config";
import { TOKEN_SERVICE } from "./application/ports/token.service";
import { JWTTokenService } from "./application/adapters/jwt-token.service";
import { JwtStrategy } from "./application/strategies/jwt.strategy";
import { AuthValidationService } from "./application/services/auth-validation.service";
import { SIGN_UP_USE_CASE } from "./application/use-cases/auth.use-cases";
import { AuthUseCasesImpl } from "./application/use-cases/impls/auth.use-cases.impl";
import jwtConfig from "./config/jwt.config";
import { USER_QUERY_REPOSITORY } from "./application/ports/user-query-repo.service";
import { UserQueryDrizzleRepository } from "./application/adapters/user-query-drizzle-repo.service";
import { TOKEN_INVALIDATION_REPOSITORY } from "./application/ports/token-invalidation-repo.service";
import { CacheTokenInvalidationRepoService } from "./application/adapters/cache-token-invalidation-repo.service";
import { PASSWORD_SERVICE } from "./application/ports/password.service";
import { BcryptPasswordService } from "./application/adapters/bcrypt-password.service";

@Module({
  imports: [ConfigModule.forFeature(jwtConfig), JwtModule.register({}), PassportModule],
  providers: [
    UsersResolver,
    UsersService,
    { provide: TOKEN_SERVICE, useClass: JWTTokenService },
    { provide: USER_QUERY_REPOSITORY, useClass: UserQueryDrizzleRepository },
    { provide: TOKEN_INVALIDATION_REPOSITORY, useClass: CacheTokenInvalidationRepoService },
    { provide: PASSWORD_SERVICE, useClass: BcryptPasswordService },
    JwtStrategy,
    AuthValidationService,
    { provide: SIGN_UP_USE_CASE, useClass: AuthUseCasesImpl },
  ],
})
export class UsersModule {}
