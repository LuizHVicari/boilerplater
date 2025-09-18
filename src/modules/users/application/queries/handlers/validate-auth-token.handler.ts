import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";

import { AuthValidationService } from "../../services/auth-validation.service";
import {
  ValidateAuthTokenQuery,
  ValidateAuthTokenQueryResponse,
} from "../validate-auth-token.query";

@QueryHandler(ValidateAuthTokenQuery)
export class ValidateAuthTokenHandler implements IQueryHandler<ValidateAuthTokenQuery> {
  constructor(private readonly authValidationService: AuthValidationService) {}

  async execute({ authToken }: ValidateAuthTokenQuery): Promise<ValidateAuthTokenQueryResponse> {
    const user = await this.authValidationService.validateAuthToken(authToken);

    return { user, token: authToken };
  }
}
