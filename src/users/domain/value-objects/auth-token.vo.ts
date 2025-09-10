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
}
