/*
  Test Cases for UserModel:
    Constructor Tests:
      1. **Happy Path**: Should create UserModel with all required properties
      2. **Auto-generated ID**: Should generate UUID v7 when ID not provided
      3. **Auto-generated Timestamps**: Should set createdAt and updatedAt when not provided
      4. **Password Validation**: Should validate bcrypt password format in constructor
      5. **Optional Fields**: Should handle optional fields (firstName, lastName, invitedById)

    Getter Methods Tests:
      6. **All Getters**: Should return correct values for all private properties
      7. **Read-only Fields**: Should properly expose readonly fields (id, email, createdAt)

    Business Logic Tests:
      8. **canAuthenticate - Valid**: Should return true when user is active and email confirmed
      9. **canAuthenticate - Inactive**: Should return false when user is inactive
      10. **canAuthenticate - Unconfirmed**: Should return false when email not confirmed
      11. **canAuthenticate - Both False**: Should return false when both inactive and unconfirmed

    State Mutation Tests:
      12. **deactivate**: Should set active to false and update timestamp
      13. **activate**: Should set active to true and update timestamp
      14. **confirmEmail**: Should set emailConfirmed to true and update timestamp
      15. **updateFirstName - Valid**: Should update firstName and timestamp
      16. **updateFirstName - Empty**: Should not update when firstName is empty/undefined
      17. **updateLastName - Valid**: Should update lastName and timestamp
      18. **updateLastName - Empty**: Should not update when lastName is empty/undefined
      19. **updatePassword - Valid**: Should update password, timestamps, and lastCredentialInvalidation
      20. **updatePassword - Empty**: Should not update when password is empty/undefined
      21. **updatePassword - Invalid**: Should throw ValidationError for invalid password format
      22. **invalidateCredential**: Should update lastCredentialInvalidation and updatedAt

    Validation Tests:
      23. **Password Format - Valid**: Should accept valid bcrypt hash
      24. **Password Format - Invalid**: Should throw ValidationError for non-bcrypt password
      25. **Timestamp Updates**: Should update updatedAt on all state-changing operations
*/

import { ValidationError } from "@shared/errors/domain-errors";

import { UserModel } from "./user.model";

describe("UserModel", () => {
  const validBcryptPassword = "$2b$10$validBcryptHashHere";
  const mockDate = new Date("2023-01-01T00:00:00.000Z");

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe("Constructor", () => {
    it("TC001: Should create UserModel with all required properties", () => {
      const props = {
        id: "test-id",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        password: validBcryptPassword,
        active: true,
        emailConfirmed: true,
        createdAt: new Date("2022-01-01T00:00:00.000Z"),
        updatedAt: new Date("2022-02-01T00:00:00.000Z"),
        invitedById: "inviter-id",
        lastCredentialInvalidation: new Date("2022-03-01T00:00:00.000Z"),
      };

      const user = new UserModel(props);

      expect(user.id).toBe("test-id");
      expect(user.email).toBe("test@example.com");
      expect(user.firstName).toBe("John");
      expect(user.lastName).toBe("Doe");
      expect(user.password).toBe(validBcryptPassword);
      expect(user.active).toBe(true);
      expect(user.emailConfirmed).toBe(true);
      expect(user.createdAt).toEqual(new Date("2022-01-01T00:00:00.000Z"));
      expect(user.updatedAt).toEqual(new Date("2022-02-01T00:00:00.000Z"));
      expect(user.invitedById).toBe("inviter-id");
      expect(user.lastCredentialInvalidation).toEqual(new Date("2022-03-01T00:00:00.000Z"));
    });

    it("TC002: Should generate UUID v7 when ID not provided", () => {
      const user = new UserModel({
        email: "test@example.com",
        password: validBcryptPassword,
        active: true,
        emailConfirmed: false,
      });

      expect(user.id).toBeDefined();
      expect(typeof user.id).toBe("string");
      expect(user.id.length).toBeGreaterThan(0);
    });

    it("TC003: Should set createdAt and updatedAt when not provided", () => {
      const user = new UserModel({
        email: "test@example.com",
        password: validBcryptPassword,
        active: true,
        emailConfirmed: false,
      });

      expect(user.createdAt).toEqual(mockDate);
      expect(user.updatedAt).toEqual(mockDate);
    });

    it("TC004: Should validate bcrypt password format in constructor", () => {
      expect(() => {
        new UserModel({
          email: "test@example.com",
          password: "invalid-password",
          active: true,
          emailConfirmed: false,
        });
      }).toThrow(ValidationError);
    });

    it("TC005: Should handle optional fields (firstName, lastName, invitedById)", () => {
      const user = new UserModel({
        email: "test@example.com",
        password: validBcryptPassword,
        active: true,
        emailConfirmed: false,
      });

      expect(user.firstName).toBeUndefined();
      expect(user.lastName).toBeUndefined();
      expect(user.invitedById).toBeUndefined();
      expect(user.lastCredentialInvalidation).toBeUndefined();
    });
  });

  describe("Getter Methods", () => {
    it("TC006: Should return correct values for all private properties", () => {
      const props = {
        id: "test-id",
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        password: validBcryptPassword,
        active: true,
        emailConfirmed: true,
        createdAt: new Date("2022-01-01T00:00:00.000Z"),
        updatedAt: new Date("2022-02-01T00:00:00.000Z"),
        invitedById: "inviter-id",
        lastCredentialInvalidation: new Date("2022-03-01T00:00:00.000Z"),
      };

      const user = new UserModel(props);

      expect(user.firstName).toBe("John");
      expect(user.lastName).toBe("Doe");
      expect(user.password).toBe(validBcryptPassword);
      expect(user.active).toBe(true);
      expect(user.emailConfirmed).toBe(true);
      expect(user.createdAt).toEqual(new Date("2022-01-01T00:00:00.000Z"));
      expect(user.updatedAt).toEqual(new Date("2022-02-01T00:00:00.000Z"));
      expect(user.invitedById).toBe("inviter-id");
      expect(user.lastCredentialInvalidation).toEqual(new Date("2022-03-01T00:00:00.000Z"));
    });

    it("TC007: Should properly expose readonly fields (id, email, createdAt)", () => {
      const user = new UserModel({
        id: "readonly-test",
        email: "readonly@example.com",
        password: validBcryptPassword,
        active: true,
        emailConfirmed: false,
        createdAt: new Date("2022-01-01T00:00:00.000Z"),
      });

      expect(user.id).toBe("readonly-test");
      expect(user.email).toBe("readonly@example.com");
      expect(user.createdAt).toEqual(new Date("2022-01-01T00:00:00.000Z"));
    });
  });

  describe("Business Logic", () => {
    it("TC008: Should return true when user is active and email confirmed", () => {
      const user = new UserModel({
        email: "test@example.com",
        password: validBcryptPassword,
        active: true,
        emailConfirmed: true,
      });

      expect(user.canAuthenticate()).toBe(true);
    });

    it("TC009: Should return false when user is inactive", () => {
      const user = new UserModel({
        email: "test@example.com",
        password: validBcryptPassword,
        active: false,
        emailConfirmed: true,
      });

      expect(user.canAuthenticate()).toBe(false);
    });

    it("TC010: Should return false when email not confirmed", () => {
      const user = new UserModel({
        email: "test@example.com",
        password: validBcryptPassword,
        active: true,
        emailConfirmed: false,
      });

      expect(user.canAuthenticate()).toBe(false);
    });

    it("TC011: Should return false when both inactive and unconfirmed", () => {
      const user = new UserModel({
        email: "test@example.com",
        password: validBcryptPassword,
        active: false,
        emailConfirmed: false,
      });

      expect(user.canAuthenticate()).toBe(false);
    });
  });

  describe("State Mutation", () => {
    let user: UserModel;

    beforeEach(() => {
      jest.setSystemTime(mockDate);
      user = new UserModel({
        email: "test@example.com",
        password: validBcryptPassword,
        active: true,
        emailConfirmed: false,
      });
    });

    it("TC012: Should set active to false and update timestamp", () => {
      const laterDate = new Date("2023-02-01T00:00:00.000Z");
      jest.setSystemTime(laterDate);

      user.deactivate();

      expect(user.active).toBe(false);
      expect(user.updatedAt).toEqual(laterDate);
    });

    it("TC013: Should set active to true and update timestamp", () => {
      user.deactivate();
      const laterDate = new Date("2023-02-01T00:00:00.000Z");
      jest.setSystemTime(laterDate);

      user.activate();

      expect(user.active).toBe(true);
      expect(user.updatedAt).toEqual(laterDate);
    });

    it("TC014: Should set emailConfirmed to true and update timestamp", () => {
      const laterDate = new Date("2023-02-01T00:00:00.000Z");
      jest.setSystemTime(laterDate);

      user.confirmEmail();

      expect(user.emailConfirmed).toBe(true);
      expect(user.updatedAt).toEqual(laterDate);
    });

    it("TC015: Should update firstName and timestamp", () => {
      const laterDate = new Date("2023-02-01T00:00:00.000Z");
      jest.setSystemTime(laterDate);

      user.updateFirstName("John");

      expect(user.firstName).toBe("John");
      expect(user.updatedAt).toEqual(laterDate);
    });

    it("TC016: Should not update when firstName is empty/undefined", () => {
      const originalUpdatedAt = user.updatedAt;

      user.updateFirstName("");
      expect(user.firstName).toBeUndefined();
      expect(user.updatedAt).toEqual(originalUpdatedAt);

      user.updateFirstName(undefined);
      expect(user.firstName).toBeUndefined();
      expect(user.updatedAt).toEqual(originalUpdatedAt);
    });

    it("TC017: Should update lastName and timestamp", () => {
      const laterDate = new Date("2023-02-01T00:00:00.000Z");
      jest.setSystemTime(laterDate);

      user.updateLastName("Doe");

      expect(user.lastName).toBe("Doe");
      expect(user.updatedAt).toEqual(laterDate);
    });

    it("TC018: Should not update when lastName is empty/undefined", () => {
      const originalUpdatedAt = user.updatedAt;

      user.updateLastName("");
      expect(user.lastName).toBeUndefined();
      expect(user.updatedAt).toEqual(originalUpdatedAt);

      user.updateLastName(undefined);
      expect(user.lastName).toBeUndefined();
      expect(user.updatedAt).toEqual(originalUpdatedAt);
    });

    it("TC019: Should update password, timestamps, and lastCredentialInvalidation", () => {
      const laterDate = new Date("2023-02-01T00:00:00.000Z");
      const newPassword = "$2b$10$newValidBcryptHash";
      jest.setSystemTime(laterDate);

      user.updatePassword(newPassword);

      expect(user.password).toBe(newPassword);
      expect(user.updatedAt).toEqual(laterDate);
      expect(user.lastCredentialInvalidation).toEqual(laterDate);
    });

    it("TC020: Should not update when password is empty/undefined", () => {
      const originalPassword = user.password;
      const originalUpdatedAt = user.updatedAt;

      user.updatePassword("");
      expect(user.password).toBe(originalPassword);
      expect(user.updatedAt).toEqual(originalUpdatedAt);

      user.updatePassword(undefined);
      expect(user.password).toBe(originalPassword);
      expect(user.updatedAt).toEqual(originalUpdatedAt);
    });

    it("TC021: Should throw ValidationError for invalid password format", () => {
      expect(() => {
        user.updatePassword("invalid-password");
      }).toThrow(ValidationError);
    });

    it("TC022: Should update lastCredentialInvalidation and updatedAt", () => {
      const laterDate = new Date("2023-02-01T00:00:00.000Z");
      jest.setSystemTime(laterDate);

      user.invalidateCredential();

      expect(user.lastCredentialInvalidation).toEqual(laterDate);
      expect(user.updatedAt).toEqual(laterDate);
    });
  });

  describe("Validation", () => {
    it("TC023: Should accept valid bcrypt hash", () => {
      expect(() => {
        new UserModel({
          email: "test@example.com",
          password: "$2b$10$validBcryptHashHere",
          active: true,
          emailConfirmed: false,
        });
      }).not.toThrow();
    });

    it("TC024: Should throw ValidationError for non-bcrypt password", () => {
      const invalidPasswords = [
        "plaintext",
        "$2a$10$invalidPrefix",
        "$1$invalid$algorithm",
        "",
        "justtext",
      ];

      const createNewUser = (password: string) => {
        return new UserModel({
          email: "test@example.com",
          password,
          active: true,
          emailConfirmed: false,
        });
      };

      invalidPasswords.forEach(password => {
        expect(() => createNewUser(password)).toThrow(ValidationError);
      });
    });

    it("TC025: Should update updatedAt on all state-changing operations", () => {
      const user = new UserModel({
        email: "test@example.com",
        password: validBcryptPassword,
        active: false,
        emailConfirmed: false,
      });

      const operations = [
        () => user.activate(),
        () => user.deactivate(),
        () => user.confirmEmail(),
        () => user.updateFirstName("John"),
        () => user.updateLastName("Doe"),
        () => user.updatePassword("$2b$10$anotherValidHash"),
        () => user.invalidateCredential(),
      ];

      operations.forEach((operation, index) => {
        const testDate = new Date(`2023-0${index + 1}-01T00:00:00.000Z`);
        jest.setSystemTime(testDate);

        operation();

        expect(user.updatedAt).toEqual(testDate);
      });
    });
  });
});
