import { Injectable } from "@nestjs/common";
import { PasswordService } from "../ports/password.service";
import * as bcrypt from "bcryptjs";

const DEFAULT_SALT = 10;
@Injectable()
export class BcryptPasswordService implements PasswordService {
  constructor(private readonly saltNumber = DEFAULT_SALT) {}

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltNumber);
    return bcrypt.hash(password, salt);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
