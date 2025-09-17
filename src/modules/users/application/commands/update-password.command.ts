import { Command } from "@nestjs/cqrs";

export interface UpdatePasswordCommandResponse {
  email: string;
  accessToken: string;
  refreshToken: string;
}

export class UpdatePasswordCommand extends Command<UpdatePasswordCommandResponse> {
  constructor(
    public readonly userId: string,
    public readonly currentPassword: string,
    public readonly newPassword: string,
    public readonly invalidateSessions: boolean,
  ) {
    super();
  }
}
