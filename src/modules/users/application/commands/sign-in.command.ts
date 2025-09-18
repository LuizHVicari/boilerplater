import { Command } from "@nestjs/cqrs";

export interface SignInCommandResponse {
  email: string;
  accessToken: string;
  refreshToken: string;
}

export class SignInCommand extends Command<SignInCommandResponse> {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {
    super();
  }
}
