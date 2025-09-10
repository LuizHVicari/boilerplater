import { v7 } from "uuid";

interface UserProps {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  password: string;
  active: boolean;
  emailConfirmed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  invitedById?: string;
  lastCredentialInvalidation?: Date;
}

export class UserModel {
  readonly id: string;
  readonly email: string;
  private _firstName?: string;
  private _lastName?: string;
  private _password: string;
  private _active: boolean;
  private _emailConfirmed: boolean;
  private _updatedAt: Date;
  private _lastCredentialInvalidation?: Date;
  private readonly _createdAt: Date;
  private readonly _invitedById?: string;

  constructor(props: UserProps) {
    this.id = props.id ?? v7();
    this.email = props.email;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._password = props.password;
    this._active = props.active;
    this._emailConfirmed = props.emailConfirmed;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
    this._invitedById = props.invitedById;
    this._lastCredentialInvalidation = props.lastCredentialInvalidation;

    this.validatePassword(this._password);
  }

  get firstName(): string | undefined {
    return this._firstName;
  }

  get lastCredentialInvalidation(): Date | undefined {
    return this._lastCredentialInvalidation;
  }

  get password(): string {
    return this._password;
  }

  get lastName(): string | undefined {
    return this._lastName;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get invitedById(): string | undefined {
    return this._invitedById;
  }

  get active(): boolean {
    return this._active;
  }

  get emailConfirmed(): boolean {
    return this._emailConfirmed;
  }

  deactivate(): void {
    this._active = false;
    this._updatedAt = new Date();
  }

  activate(): void {
    this._active = true;
    this._updatedAt = new Date();
  }

  confirmEmail(): void {
    this._emailConfirmed = true;
    this._updatedAt = new Date();
  }

  updateFirstName(firstName?: string): void {
    if (!firstName) {
      return;
    }

    this._firstName = firstName;
    this._updatedAt = new Date();
  }

  updateLastName(lastName?: string): void {
    if (!lastName) {
      return;
    }

    this._lastName = lastName;
    this._updatedAt = new Date();
  }

  updatePassword(password?: string): void {
    if (!password) {
      return;
    }

    this.validatePassword(password);

    this._password = password;
    this._updatedAt = new Date();
    this._lastCredentialInvalidation = new Date();
  }

  invalidateCredential(): void {
    this._lastCredentialInvalidation = new Date();
    this._updatedAt = new Date();
  }

  private validatePassword(password: string): void {
    if (!password.startsWith("$2b$")) {
      throw new Error("Password must be hashed before creating User entity");
    }
  }
}
