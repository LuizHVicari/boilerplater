/*
Test Cases for LocalStrategy:

Method Purpose: when receiving email and password, validates credentials using SignInCommand
  and returns the user for authentication

  1. **Happy Path**: When receiving valid email and password, it should execute SignInCommand
    and return the authenticated user
  2. **Error**: When SignInCommand throws InvalidCredentialsError, it should propagate the error
  3. **Error**: When SignInCommand throws InvalidStateError, it should propagate the error
*/

import { TestBed } from "@automock/jest";
import { CommandBus } from "@nestjs/cqrs";
import { InvalidCredentialsError, InvalidStateError } from "src/shared/errors/domain-errors";

import { SignInCommand } from "../commands/sign-in.command";
import { LocalStrategy } from "./local.strategy";

describe("LocalStrategy", () => {
  let strategy: LocalStrategy;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(LocalStrategy).compile();

    strategy = unit;
    commandBus = unitRef.get(CommandBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("TC001: Should execute SignInCommand and return email when credentials are valid", () => {
    it("should execute SignInCommand and return email when credentials are valid", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "validPassword";

      const mockSignInResponse = {
        email,
        accessToken: "access-token-123",
        refreshToken: "refresh-token-456",
      };

      commandBus.execute.mockResolvedValue(mockSignInResponse);

      // Act
      const result = await strategy.validate(email, password);

      // Assert
      expect(result).toBe(email);
      expect(commandBus.execute).toHaveBeenCalledWith(new SignInCommand(email, password));
    });
  });

  describe("TC002: Should propagate InvalidCredentialsError when SignInCommand throws it", () => {
    it("should propagate InvalidCredentialsError when credentials are invalid", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "invalidPassword";

      commandBus.execute.mockRejectedValue(new InvalidCredentialsError());

      // Act & Assert
      await expect(strategy.validate(email, password)).rejects.toThrow(InvalidCredentialsError);
      expect(commandBus.execute).toHaveBeenCalledWith(new SignInCommand(email, password));
    });
  });

  describe("TC003: Should propagate InvalidStateError when SignInCommand throws it", () => {
    it("should propagate InvalidStateError when user state is invalid", async () => {
      // Arrange
      const email = "test@example.com";
      const password = "validPassword";

      commandBus.execute.mockRejectedValue(new InvalidStateError());

      // Act & Assert
      await expect(strategy.validate(email, password)).rejects.toThrow(InvalidStateError);
      expect(commandBus.execute).toHaveBeenCalledWith(new SignInCommand(email, password));
    });
  });
});
