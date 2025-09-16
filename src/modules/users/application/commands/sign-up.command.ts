import { Command } from "@nestjs/cqrs";

export interface SignUpCommandResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SignUpCommand extends Command<SignUpCommandResponse> {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
  ) {
    super();
  }
}
