import { Injectable } from "@nestjs/common";
import { Command } from "@nestjs/cqrs";

export interface ForgotPasswordCommandResponse {
  email: string;
}

@Injectable()
export class ForgotPasswordCommand extends Command<ForgotPasswordCommandResponse> {
  constructor(public readonly email: string) {
    super();
  }
}
