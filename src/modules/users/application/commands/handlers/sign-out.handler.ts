import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { TOKEN_SERVICE, type TokenService } from "../../ports/token.service";
import {
  TOKEN_INVALIDATION_REPOSITORY,
  type TokenInvalidationRepository,
} from "../../ports/token-invalidation-repo.service";
import { SignOutCommand, SignOutCommandResponse } from "../sign-out.command";

@CommandHandler(SignOutCommand)
export class SignOutHandler implements ICommandHandler<SignOutCommand> {
  constructor(
    @Inject(TOKEN_INVALIDATION_REPOSITORY)
    private readonly tokenInvalidationRepository: TokenInvalidationRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute({ accessToken, refreshToken }: SignOutCommand): Promise<SignOutCommandResponse> {
    const [accessAuthToken, refreshAuthToken] = await Promise.all([
      this.tokenService.verifyToken(accessToken),
      this.tokenService.verifyToken(refreshToken),
    ]);

    await Promise.all([
      this.tokenInvalidationRepository.invalidateToken(accessAuthToken),
      this.tokenInvalidationRepository.invalidateToken(refreshAuthToken),
    ]);

    return { success: true };
  }
}
