/*
  Test Cases for UserModelSchemaMapper:
    Method Name: model2DB
      Method Purpose: Convert UserModel to DBNewUser

      1. **Happy Path**: Should convert UserModel to DBNewUser with all fields
      2. **Required Fields**: Should map required fields (id, email, password, active, emailConfirmed)
      3. **Optional Fields**: Should map optional fields (firstName, lastName, etc.)
      4. **Null Values**: Should handle UserModel with undefined optional fields
      5. **Date Fields**: Should preserve Date objects for timestamps
    
    Method Name: dB2Model
      Method Purpose: Convert DBUser to UserModel
      
      6. **Happy Path**: Should convert DBUser to UserModel with all fields
      7. **Required Fields**: Should map required fields correctly
      8. **Null Handling**: Should convert null database values to undefined
      9. **Date Conversion**: Should handle null dates and convert to undefined
    
    
    10. **Integration - Round Trip**: Should maintain data integrity through model2DB -> dB2Model
    11. **Edge Case**: Should handle empty/minimal user data
    12. **Validation**: Should preserve data types and structure integrity
*/

import { DBUser } from "src/db/schema";

import { UserModel } from "../../domain/models/user.model";
import { UserModelSchemaMapper } from "./user-model-schema.mapper";

describe("UserModelSchemaMapper", () => {
  let mapper: UserModelSchemaMapper;

  beforeAll(() => {
    mapper = new UserModelSchemaMapper();
  });

  describe("model2DB", () => {
    it("TC001: Should convert UserModel to DBNewUser with all fields", () => {
      // Arrange
      const user = new UserModel({
        id: "1",
        email: "j6E2a@example.com",
        password: "$2b$10$validHash",
        active: true,
        firstName: "John",
        lastName: "Doe",
        emailConfirmed: true,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-02-01T00:00:00.000Z"),
      });

      // Act
      const result = mapper.model2DB(user);

      // Assert
      expect(result).toEqual({
        id: "1",
        email: "j6E2a@example.com",
        password: "$2b$10$validHash",
        active: true,
        firstName: "John",
        lastName: "Doe",
        emailConfirmed: true,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-02-01T00:00:00.000Z"),
      });
    });

    it("TC002: Should map required fields (id, email, password, active, emailConfirmed)", () => {
      // Arrange
      const user = new UserModel({
        id: "1",
        email: "j6E2a@example.com",
        password: "$2b$10$validHash",
        active: true,
        emailConfirmed: true,
      });

      // Act
      const result = mapper.model2DB(user);

      // Assert
      expect(result).toEqual({
        id: "1",
        email: "j6E2a@example.com",
        password: "$2b$10$validHash",
        active: true,
        emailConfirmed: true,
        firstName: undefined,
        lastName: undefined,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        invitedById: undefined,
        lastCredentialInvalidation: undefined,
      });
    });

    it("TC003: Should map optional fields (firstName, lastName, etc.)", () => {
      // Arrange
      const user = new UserModel({
        id: "1",
        email: "j6E2a@example.com",
        password: "$2b$10$validHash",
        active: true,
        emailConfirmed: true,
        firstName: "John",
        lastName: "Doe",
      });

      // Act
      const result = mapper.model2DB(user);

      // Assert
      expect(result).toEqual({
        id: "1",
        email: "j6E2a@example.com",
        password: "$2b$10$validHash",
        active: true,
        emailConfirmed: true,
        firstName: "John",
        lastName: "Doe",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        invitedById: undefined,
        lastCredentialInvalidation: undefined,
      });
    });

    it("TC004: Should handle UserModel with undefined optional fields", () => {
      // Arrange
      const user = new UserModel({
        id: "1",
        email: "j6E2a@example.com",
        password: "$2b$10$validHash",
        active: true,
        emailConfirmed: true,
        firstName: undefined,
        lastName: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        invitedById: undefined,
        lastCredentialInvalidation: undefined,
      });

      // Act
      const result = mapper.model2DB(user);

      // Assert
      expect(result).toEqual({
        id: "1",
        email: "j6E2a@example.com",
        password: "$2b$10$validHash",
        active: true,
        emailConfirmed: true,
        firstName: undefined,
        lastName: undefined,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        invitedById: undefined,
        lastCredentialInvalidation: undefined,
      });
    });

    it("TC005: Should preserve Date objects for timestamps", () => {
      // Arrange
      const user = new UserModel({
        id: "1",
        email: "j6E2a@example.com",
        password: "$2b$10$validHash",
        active: true,
        emailConfirmed: true,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-02-01T00:00:00.000Z"),
      });

      // Act
      const result = mapper.model2DB(user);

      // Assert
      expect(result).toEqual({
        id: "1",
        email: "j6E2a@example.com",
        password: "$2b$10$validHash",
        active: true,
        emailConfirmed: true,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-02-01T00:00:00.000Z"),
      });
    });
  });

  describe("dB2Model", () => {
    it("TC006: Should convert DBUser to UserModel with all fields", () => {
      // Arrange
      const dbUser: DBUser = {
        id: "1",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        password: "$2b$10$validHash",
        active: true,
        emailConfirmed: true,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-02-01T00:00:00.000Z"),
        invitedById: "invited-id",
        lastCredentialInvalidation: new Date("2023-03-01T00:00:00.000Z"),
      };

      // Act
      const result = mapper.dB2Model(dbUser);

      // Assert
      expect(result).toBeInstanceOf(UserModel);
      expect(result.id).toBe("1");
      expect(result.email).toBe("test@example.com");
      expect(result.firstName).toBe("John");
      expect(result.lastName).toBe("Doe");
      expect(result.password).toBe("$2b$10$validHash");
      expect(result.active).toBe(true);
      expect(result.emailConfirmed).toBe(true);
      expect(result.createdAt).toEqual(new Date("2023-01-01T00:00:00.000Z"));
      expect(result.updatedAt).toEqual(new Date("2023-02-01T00:00:00.000Z"));
      expect(result.invitedById).toBe("invited-id");
      expect(result.lastCredentialInvalidation).toEqual(new Date("2023-03-01T00:00:00.000Z"));
    });

    it("TC007: Should map required fields correctly", () => {
      // Arrange
      const dbUser: DBUser = {
        id: "1",
        email: "test@example.com",
        password: "$2b$10$validHash",
        active: true,
        emailConfirmed: false,
        firstName: null,
        lastName: null,
        createdAt: null,
        updatedAt: null,
        invitedById: null,
        lastCredentialInvalidation: null,
      };

      // Act
      const result = mapper.dB2Model(dbUser);

      // Assert
      expect(result.id).toBe("1");
      expect(result.email).toBe("test@example.com");
      expect(result.password).toBe("$2b$10$validHash");
      expect(result.active).toBe(true);
      expect(result.emailConfirmed).toBe(false);
    });

    it("TC008: Should convert null database values to undefined", () => {
      // Arrange
      const dbUser: DBUser = {
        id: "1",
        email: "test@example.com",
        password: "$2b$10$validHash",
        active: true,
        emailConfirmed: true,
        firstName: null,
        lastName: null,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-02-01T00:00:00.000Z"),
        invitedById: null,
        lastCredentialInvalidation: null,
      };

      // Act
      const result = mapper.dB2Model(dbUser);

      // Assert
      expect(result.firstName).toBeUndefined();
      expect(result.lastName).toBeUndefined();
      expect(result.invitedById).toBeUndefined();
      expect(result.lastCredentialInvalidation).toBeUndefined();
    });

    it("TC009: Should handle null dates and convert to undefined", () => {
      // Arrange
      const dbUser: DBUser = {
        id: "1",
        email: "test@example.com",
        password: "$2b$10$validHash",
        active: true,
        emailConfirmed: true,
        firstName: null,
        lastName: null,
        createdAt: null,
        updatedAt: null,
        invitedById: null,
        lastCredentialInvalidation: null,
      };

      // Act
      const result = mapper.dB2Model(dbUser);

      // Assert
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.lastCredentialInvalidation).toBeUndefined();
    });
  });

  describe("Integration - Round Trip", () => {
    it("TC010: Should maintain data integrity through model2DB -> dB2Model", () => {
      // Arrange
      const originalUser = new UserModel({
        id: "original-id",
        email: "roundtrip@example.com",
        firstName: "Round",
        lastName: "Trip",
        password: "$2b$10$roundTripHash",
        active: true,
        emailConfirmed: true,
        invitedById: "inviter-id",
        lastCredentialInvalidation: new Date("2023-03-01T00:00:00.000Z"),
      });

      // Act
      const dbUser = mapper.model2DB(originalUser);
      const reconstructedUser = mapper.dB2Model(dbUser as DBUser);

      // Assert
      expect(reconstructedUser.id).toBe(originalUser.id);
      expect(reconstructedUser.email).toBe(originalUser.email);
      expect(reconstructedUser.firstName).toBe(originalUser.firstName);
      expect(reconstructedUser.lastName).toBe(originalUser.lastName);
      expect(reconstructedUser.password).toBe(originalUser.password);
      expect(reconstructedUser.active).toBe(originalUser.active);
      expect(reconstructedUser.emailConfirmed).toBe(originalUser.emailConfirmed);
      expect(reconstructedUser.invitedById).toBe(originalUser.invitedById);
      expect(reconstructedUser.lastCredentialInvalidation).toEqual(
        originalUser.lastCredentialInvalidation,
      );
      expect(reconstructedUser.createdAt).toBeDefined();
      expect(reconstructedUser.updatedAt).toBeDefined();
    });
  });

  describe("Edge Case", () => {
    it("TC011: Should handle empty/minimal user data", () => {
      // Arrange
      const minimalUser = new UserModel({
        email: "minimal@example.com",
        password: "$2b$10$minimalHash",
        active: false,
        emailConfirmed: false,
      });

      // Act
      const dbUser = mapper.model2DB(minimalUser);
      const reconstructedUser = mapper.dB2Model(dbUser as DBUser);

      // Assert
      expect(reconstructedUser.email).toBe("minimal@example.com");
      expect(reconstructedUser.password).toBe("$2b$10$minimalHash");
      expect(reconstructedUser.active).toBe(false);
      expect(reconstructedUser.emailConfirmed).toBe(false);
      expect(reconstructedUser.firstName).toBeUndefined();
      expect(reconstructedUser.lastName).toBeUndefined();
      expect(reconstructedUser.invitedById).toBeUndefined();
      expect(reconstructedUser.lastCredentialInvalidation).toBeUndefined();
      expect(reconstructedUser.id).toBeDefined();
      expect(reconstructedUser.createdAt).toBeDefined();
      expect(reconstructedUser.updatedAt).toBeDefined();
    });
  });

  describe("Validation", () => {
    it("TC012: Should preserve data types and structure integrity", () => {
      // Arrange
      const user = new UserModel({
        id: "type-test-id",
        email: "types@example.com",
        firstName: "Type",
        lastName: "Test",
        password: "$2b$10$typeHash",
        active: true,
        emailConfirmed: true,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-02-01T00:00:00.000Z"),
        invitedById: "inviter-id",
        lastCredentialInvalidation: new Date("2023-03-01T00:00:00.000Z"),
      });

      // Act
      const dbUser = mapper.model2DB(user);
      const reconstructedUser = mapper.dB2Model(dbUser as DBUser);

      // Assert
      expect(typeof dbUser.id).toBe("string");
      expect(typeof dbUser.email).toBe("string");
      expect(typeof dbUser.firstName).toBe("string");
      expect(typeof dbUser.lastName).toBe("string");
      expect(typeof dbUser.password).toBe("string");
      expect(typeof dbUser.active).toBe("boolean");
      expect(typeof dbUser.emailConfirmed).toBe("boolean");
      expect(dbUser.createdAt).toBeInstanceOf(Date);
      expect(dbUser.updatedAt).toBeInstanceOf(Date);
      expect(typeof dbUser.invitedById).toBe("string");
      expect(dbUser.lastCredentialInvalidation).toBeInstanceOf(Date);

      // Assert
      expect(reconstructedUser).toBeInstanceOf(UserModel);
      expect(typeof reconstructedUser.id).toBe("string");
      expect(typeof reconstructedUser.email).toBe("string");
      expect(typeof reconstructedUser.firstName).toBe("string");
      expect(typeof reconstructedUser.lastName).toBe("string");
      expect(typeof reconstructedUser.password).toBe("string");
      expect(typeof reconstructedUser.active).toBe("boolean");
      expect(typeof reconstructedUser.emailConfirmed).toBe("boolean");
      expect(reconstructedUser.createdAt).toBeInstanceOf(Date);
      expect(reconstructedUser.updatedAt).toBeInstanceOf(Date);
      expect(typeof reconstructedUser.invitedById).toBe("string");
      expect(reconstructedUser.lastCredentialInvalidation).toBeInstanceOf(Date);
    });
  });
});
