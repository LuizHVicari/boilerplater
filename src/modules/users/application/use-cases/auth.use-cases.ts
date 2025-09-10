export const SIGN_UP_USE_CASE = Symbol("SIGN_UP_USE_CASE");

export interface SignUpUseCaseCommand {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface SignUpUseCaseResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SignUpUseCase {
  signUp(command: SignUpUseCaseCommand): Promise<SignUpUseCaseResponse>;
}
