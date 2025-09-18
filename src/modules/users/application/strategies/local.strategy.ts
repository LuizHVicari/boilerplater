import { Injectable } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";

import { SignInCommand } from "../commands/sign-in.command";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly commandBus: CommandBus) {
    super({
      usernameField: "email",
      passwordField: "password",
    });
  }

  async validate(email: string, password: string): Promise<string> {
    const signInResult = await this.commandBus.execute(new SignInCommand(email, password));
    return signInResult.email;
  }
}
