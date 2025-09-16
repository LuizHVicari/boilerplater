import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

import { BcryptPasswordService } from "./application/adapters/bcrypt-password.service";
import { CacheTokenInvalidationRepoService } from "./application/adapters/cache-token-invalidation-repo.service";
import { JWTTokenService } from "./application/adapters/jwt-token.service";
import { UserQueryDrizzleRepository } from "./application/adapters/user-query-drizzle-repo.service";
import { AuthInteractor } from "./application/interactors/auth.interactor";
import { PASSWORD_SERVICE } from "./application/ports/password.service";
import { TOKEN_SERVICE } from "./application/ports/token.service";
import { TOKEN_INVALIDATION_REPOSITORY } from "./application/ports/token-invalidation-repo.service";
import { USER_QUERY_REPOSITORY } from "./application/ports/user-query-repo.service";
import { AuthValidationService } from "./application/services/auth-validation.service";
import { JwtStrategy } from "./application/strategies/jwt.strategy";
import { SIGN_UP_USE_CASE } from "./application/use-cases/auth.use-cases";
import jwtConfig from "./config/jwt.config";
import { AuthResolver } from "./presentation/graphql/resolvers/auth.resolver";

@Module({
  imports: [ConfigModule.forFeature(jwtConfig), JwtModule.register({}), PassportModule],
  providers: [
    JwtStrategy,
    AuthValidationService,
    { provide: TOKEN_SERVICE, useClass: JWTTokenService },
    { provide: USER_QUERY_REPOSITORY, useClass: UserQueryDrizzleRepository },
    { provide: TOKEN_INVALIDATION_REPOSITORY, useClass: CacheTokenInvalidationRepoService },
    { provide: PASSWORD_SERVICE, useClass: BcryptPasswordService },
    { provide: SIGN_UP_USE_CASE, useClass: AuthInteractor },
    AuthResolver,
  ],
})
export class UsersModule {}
