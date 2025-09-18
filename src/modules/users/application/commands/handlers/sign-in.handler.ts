import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { InvalidCredentialsError, InvalidStateError } from "src/shared/errors/domain-errors";

import { PASSWORD_SERVICE, type PasswordService } from "../../ports/password.service";
import { TOKEN_SERVICE, type TokenService } from "../../ports/token.service";
import {
  USER_QUERY_REPOSITORY,
  type UserQueryRepository,
} from "../../ports/user-query-repo.service";
import { SignInCommand, SignInCommandResponse } from "../sign-in.command";

const DUMMY_HASH = "$2b$10$dummyHashForTimingAttackProtection";

@CommandHandler(SignInCommand)
export class SignInHandler implements ICommandHandler<SignInCommand> {
  constructor(
    @Inject(USER_QUERY_REPOSITORY)
    private readonly userQueryRepository: UserQueryRepository,
    @Inject(PASSWORD_SERVICE)
    private readonly passwordService: PasswordService,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute({ email, password }: SignInCommand): Promise<SignInCommandResponse> {
    const user = await this.userQueryRepository.findUserByEmail(email);
    const hashToCompare = user?.password ?? DUMMY_HASH;

    const isPasswordValid = await this.passwordService.verifyPassword(password, hashToCompare);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    if (!user.canAuthenticate()) {
      throw new InvalidStateError();
    }

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.generateToken(user, "access"),
      this.tokenService.generateToken(user, "refresh"),
    ]);

    return {
      email: user.email,
      accessToken,
      refreshToken,
    };
  }
}
