import { Command } from "@nestjs/cqrs";

export interface ResendEmailConfirmationCommandResponse {
  email: string;
}

export class ResendEmailConfirmationCommand extends Command<ResendEmailConfirmationCommandResponse> {
  constructor(public readonly email: string) {
    super();
  }
}
