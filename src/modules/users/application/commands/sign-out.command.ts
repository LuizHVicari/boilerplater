import { Command } from "@nestjs/cqrs";

export interface SignOutCommandResponse {
  success: boolean;
}

export class SignOutCommand extends Command<SignOutCommandResponse> {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string,
  ) {
    super();
  }
}
