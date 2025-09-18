import { Command } from "@nestjs/cqrs";

export interface RefreshTokenCommandResponse {
  accessToken: string;
}

export class RefreshTokenCommand extends Command<RefreshTokenCommandResponse> {
  constructor(public readonly refreshToken: string) {
    super();
  }
}
