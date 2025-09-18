import { secondsToMilliseconds } from "src/shared/utils/time";

interface Props {
  sub: string;
  iat: number;
  exp: number;
  jti: string;
  type: "access" | "refresh" | "email-confirmation" | "password-recovery";
}

export class AuthToken {
  readonly sub: string;
  readonly iat: number;
  readonly exp: number;
  readonly jti: string;
  readonly type: "access" | "refresh" | "email-confirmation" | "password-recovery";

  constructor(props: Props) {
    this.sub = props.sub;
    this.iat = props.iat;
    this.exp = props.exp;
    this.jti = props.jti;
    this.type = props.type;
  }

  isValidForAuthentication(): boolean {
    return this.type === "access";
  }

  isValidForRefresh(): boolean {
    return this.type === "refresh";
  }

  isExpired(): boolean {
    return Date.now() > secondsToMilliseconds(this.exp);
  }
}
