import { Injectable } from "@nestjs/common";
import { Command } from "@nestjs/cqrs";

export interface ForgotPassowordCommandResponse {
  email: string;
}

@Injectable()
export class ForgotPassowordCommand extends Command<ForgotPassowordCommandResponse> {
  constructor(public readonly email: string) {
    super();
  }
}
