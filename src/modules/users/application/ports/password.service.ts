export const PASSWORD_SERVICE = Symbol("PASSWORD_SERVICE");

export interface PasswordService {
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
}
