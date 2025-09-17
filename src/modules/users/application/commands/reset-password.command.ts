import { Command } from "@nestjs/cqrs";

export interface ResetPasswordCommandResponse {
  email: string;
}

export class ResetPasswordCommand extends Command<ResetPasswordCommandResponse> {
  constructor(
    public readonly token: string,
    public readonly password: string,
  ) {
    super();
  }
}
