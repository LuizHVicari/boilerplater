import { Query } from "@nestjs/cqrs";

import { UserModel } from "../../domain/models/user.model";
import { AuthToken } from "../../domain/value-objects/auth-token.vo";

export interface ValidateAuthTokenQueryResponse {
  user: UserModel;
  token: AuthToken;
}

export class ValidateAuthTokenQuery extends Query<ValidateAuthTokenQueryResponse> {
  constructor(public readonly authToken: AuthToken) {
    super();
  }
}
