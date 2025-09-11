import { UserModel } from "../../domain/models/user.model";
import { AuthToken } from "../../domain/value-objects/auth-token.vo";

export const TOKEN_SERVICE = Symbol("TOKEN_SERVICE");

export interface TokenService {
  generateToken(user: UserModel, type: AuthToken["type"]): Promise<string>;
  verifyToken(token: string): Promise<AuthToken>;
}
