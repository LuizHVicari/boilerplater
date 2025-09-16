import { Command } from "@nestjs/cqrs";

export interface ConfirmEmailCommandResponse {
  email: string;
  id: string;
}

export class ConfirmEmailCommand extends Command<ConfirmEmailCommandResponse> {
  constructor(public readonly token: string) {
    super();
  }
}
