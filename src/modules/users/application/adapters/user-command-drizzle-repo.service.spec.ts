/*
Test Cases for UserCommandDrizzleRepo:
  Method Name: createUser
    Method Purpose: Insert new user into database and return created user

    1. **Happy Path**: Should create user with all fields and return created user
    2. **Required Fields**: Should create user with only required fields
    3. **Auto Generation**: Should auto-generate ID and timestamps when not provided
    4. **Email Uniqueness**: Should throw error when creating user with duplicate email
    5. **Validation**: Should throw ValidationError when database operation fails

  Method Name: updateUser
    Method Purpose: Update existing user in database and return updated user

    6. **Happy Path**: Should update user with new data and return updated user
    7. **Partial Update**: Should update only provided fields, keeping others unchanged
    8. **Timestamp Update**: Should update updatedAt timestamp automatically
    9. **Not Found**: Should throw UserNotFoundError when user does not exist
    10. **Email Uniqueness**: Should throw error when updating to duplicate email

  Method Name: deleteUser
    Method Purpose: Delete user from database by ID

    11. **Happy Path**: Should delete existing user successfully
    12. **Not Found**: Should throw UserNotFoundError when user does not exist
    13. **Cascade**: Should handle deletion without affecting other users

  Integration Tests:
    14. **CRUD Lifecycle**: Should create, update, and delete user in sequence
    15. **Multiple Users**: Should handle operations on multiple users independently
    16. **Data Integrity**: Should maintain data types and constraints correctly
*/

import { DatabaseTestHelper } from "src/test/helpers/database-test.helper";
import { v7 as uuidv7 } from "uuid";

import { UserNotFoundError } from "../../domain/errors/user.errors";
import { UserModel } from "../../domain/models/user.model";
import { UserCommandDrizzleRepo } from "./user-command-drizzle-repo.service";

describe("UserCommandDrizzleRepo", () => {
  let userCommandRepo: UserCommandDrizzleRepo;
  let databaseHelper: DatabaseTestHelper;

  beforeAll(async () => {
    databaseHelper = new DatabaseTestHelper();
    const { db } = await databaseHelper.startContainer();

    userCommandRepo = new UserCommandDrizzleRepo(db);
  }, 60000);

  afterAll(async () => {
    await databaseHelper.stopContainer();
  }, 10000);

  beforeEach(async () => {
    await databaseHelper.clearDatabase();
  });

  describe("createUser", () => {
    it("TC001: Should create user with all fields and return created user", async () => {
      // Arrange
      const userData = {
        id: uuidv7(),
        email: "john.doe@example.com",
        firstName: "John",
        lastName: "Doe",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: false,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
        invitedById: uuidv7(),
      };

      const user = new UserModel(userData);

      // Act
      const result = await userCommandRepo.createUser(user);

      // Assert
      expect(result).toBeInstanceOf(UserModel);
      expect(result.id).toBe(userData.id);
      expect(result.email).toBe(userData.email);
      expect(result.firstName).toBe(userData.firstName);
      expect(result.lastName).toBe(userData.lastName);
      expect(result.password).toBe(userData.password);
      expect(result.active).toBe(userData.active);
      expect(result.emailConfirmed).toBe(userData.emailConfirmed);
      expect(result.invitedById).toBe(userData.invitedById);
      expect(result.createdAt).toEqual(userData.createdAt);
      expect(result.updatedAt).toEqual(userData.updatedAt);
    });

    it("TC002: Should create user with only required fields", async () => {
      // Arrange
      const minimalUserData = {
        email: "minimal@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: false,
      };

      const user = new UserModel(minimalUserData);

      // Act
      const result = await userCommandRepo.createUser(user);

      // Assert
      expect(result).toBeInstanceOf(UserModel);
      expect(result.email).toBe(minimalUserData.email);
      expect(result.password).toBe(minimalUserData.password);
      expect(result.active).toBe(minimalUserData.active);
      expect(result.emailConfirmed).toBe(minimalUserData.emailConfirmed);
      expect(result.firstName).toBeUndefined();
      expect(result.lastName).toBeUndefined();
      expect(result.invitedById).toBeUndefined();
      expect(result.lastCredentialInvalidation).toBeUndefined();
    });

    it("TC003: Should auto-generate ID and timestamps when not provided", async () => {
      // Arrange
      const userData = {
        email: "autogen@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: false,
      };

      const user = new UserModel(userData);

      // Act
      const result = await userCommandRepo.createUser(user);

      // Assert
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^[0-9a-f-]+$/);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(Date.now());
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it("TC004: Should throw error when creating user with duplicate email", async () => {
      // Arrange
      const email = "duplicate@example.com";
      const userData1 = {
        email,
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: false,
      };

      const userData2 = {
        email,
        password: "$2b$10$hashedPassword987654321",
        active: true,
        emailConfirmed: false,
      };

      const user1 = new UserModel(userData1);
      const user2 = new UserModel(userData2);

      await userCommandRepo.createUser(user1);

      // Act & Assert
      await expect(userCommandRepo.createUser(user2)).rejects.toThrow();
    });

    it("TC005: Should throw ValidationError when database operation fails", async () => {
      // Arrange
      await databaseHelper.stopContainer();

      const userData = {
        email: "fail@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: false,
      };

      const user = new UserModel(userData);

      // Act & Assert
      await expect(userCommandRepo.createUser(user)).rejects.toThrow();

      const { db } = await databaseHelper.startContainer();
      userCommandRepo = new UserCommandDrizzleRepo(db);
    }, 30000);
  });

  describe("updateUser", () => {
    it("TC006: Should update user with new data and return updated user", async () => {
      // Arrange
      const initialData = {
        email: "update@example.com",
        firstName: "Initial",
        lastName: "Name",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: false,
      };

      const user = new UserModel(initialData);
      const createdUser = await userCommandRepo.createUser(user);

      const updatedUser = new UserModel({
        id: createdUser.id,
        email: "updated@example.com",
        firstName: "Updated",
        lastName: "LastName",
        password: "$2b$10$newHashedPassword123456789",
        active: false,
        emailConfirmed: true,
        createdAt: createdUser.createdAt,
        updatedAt: new Date(),
      });

      // Act
      const result = await userCommandRepo.updateUser(updatedUser);

      // Assert
      expect(result).toBeInstanceOf(UserModel);
      expect(result.id).toBe(createdUser.id);
      expect(result.email).toBe("updated@example.com");
      expect(result.firstName).toBe("Updated");
      expect(result.lastName).toBe("LastName");
      expect(result.password).toBe("$2b$10$newHashedPassword123456789");
      expect(result.active).toBe(false);
      expect(result.emailConfirmed).toBe(true);
      expect(result.createdAt).toEqual(createdUser.createdAt);
      expect(result.updatedAt.getTime()).toBeGreaterThan(createdUser.updatedAt.getTime());
    });

    it("TC007: Should update only provided fields, keeping others unchanged", async () => {
      const initialData = {
        email: "partial@example.com",
        firstName: "Original",
        lastName: "Name",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: false,
      };

      const user = new UserModel(initialData);
      const createdUser = await userCommandRepo.createUser(user);

      const partialUpdate = new UserModel({
        id: createdUser.id,
        email: createdUser.email,
        firstName: "Updated",
        lastName: createdUser.lastName,
        password: createdUser.password,
        active: false,
        emailConfirmed: createdUser.emailConfirmed,
        createdAt: createdUser.createdAt,
        updatedAt: new Date(),
      });

      // Act
      const result = await userCommandRepo.updateUser(partialUpdate);

      // Assert
      expect(result.firstName).toBe("Updated");
      expect(result.active).toBe(false);
      expect(result.lastName).toBe("Name");
      expect(result.email).toBe("partial@example.com");
      expect(result.emailConfirmed).toBe(false);
    });

    it("TC008: Should update updatedAt timestamp automatically", async () => {
      // Arrange
      const user = new UserModel({
        email: "timestamp@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: false,
      });

      const createdUser = await userCommandRepo.createUser(user);
      const originalUpdatedAt = createdUser.updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      const updatedUser = new UserModel({
        id: createdUser.id,
        email: createdUser.email,
        firstName: "NewName",
        lastName: createdUser.lastName,
        password: createdUser.password,
        active: createdUser.active,
        emailConfirmed: createdUser.emailConfirmed,
        createdAt: createdUser.createdAt,
        updatedAt: new Date(),
        invitedById: createdUser.invitedById,
        lastCredentialInvalidation: createdUser.lastCredentialInvalidation,
      });

      // Act
      const result = await userCommandRepo.updateUser(updatedUser);

      // Assert
      expect(result.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it("TC009: Should throw UserNotFoundError when user does not exist", async () => {
      // Arrange
      const nonExistentUser = new UserModel({
        id: uuidv7(),
        email: "nonexistent@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: false,
      });

      // Act & Assert
      await expect(userCommandRepo.updateUser(nonExistentUser)).rejects.toThrow(UserNotFoundError);
    });

    it("TC010: Should throw error when updating to duplicate email", async () => {
      // Arrange
      const user1Data = {
        email: "user1@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: false,
      };

      const user2Data = {
        email: "user2@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: false,
      };

      const user1 = await userCommandRepo.createUser(new UserModel(user1Data));
      const user2 = await userCommandRepo.createUser(new UserModel(user2Data));

      const updatedUser2 = new UserModel({
        id: user2.id,
        email: user1.email,
        firstName: user2.firstName,
        lastName: user2.lastName,
        password: user2.password,
        active: user2.active,
        emailConfirmed: user2.emailConfirmed,
        createdAt: user2.createdAt,
        updatedAt: new Date(),
        invitedById: user2.invitedById,
        lastCredentialInvalidation: user2.lastCredentialInvalidation,
      });

      // Act & Assert
      await expect(userCommandRepo.updateUser(updatedUser2)).rejects.toThrow();
    });
  });

  describe("deleteUser", () => {
    it("TC011: Should delete existing user successfully", async () => {
      // Arrange
      const userData = {
        email: "delete@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: false,
      };

      const user = new UserModel(userData);
      const createdUser = await userCommandRepo.createUser(user);

      // Act
      await userCommandRepo.deleteUser(createdUser.id);

      // Assert
      const updatedUser = new UserModel({
        id: createdUser.id,
        email: createdUser.email,
        firstName: "ShouldFail",
        lastName: createdUser.lastName,
        password: createdUser.password,
        active: createdUser.active,
        emailConfirmed: createdUser.emailConfirmed,
        createdAt: createdUser.createdAt,
        updatedAt: new Date(),
        invitedById: createdUser.invitedById,
        lastCredentialInvalidation: createdUser.lastCredentialInvalidation,
      });

      await expect(userCommandRepo.updateUser(updatedUser)).rejects.toThrow(UserNotFoundError);
    });

    it("TC012: Should throw UserNotFoundError when user does not exist", async () => {
      // Arrange
      const nonExistentId = uuidv7();

      // Act & Assert
      await expect(userCommandRepo.deleteUser(nonExistentId)).rejects.toThrow(UserNotFoundError);
    });

    it("TC013: Should handle deletion without affecting other users", async () => {
      // Arrange
      const userData1 = {
        email: "user1@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: false,
      };

      const userData2 = {
        email: "user2@example.com",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: false,
      };

      const user1 = await userCommandRepo.createUser(new UserModel(userData1));
      const user2 = await userCommandRepo.createUser(new UserModel(userData2));

      // Act
      await userCommandRepo.deleteUser(user1.id);

      // Assert
      const updatedUser2 = new UserModel({
        id: user2.id,
        email: user2.email,
        firstName: "StillExists",
        lastName: user2.lastName,
        password: user2.password,
        active: user2.active,
        emailConfirmed: user2.emailConfirmed,
        createdAt: user2.createdAt,
        updatedAt: new Date(),
        invitedById: user2.invitedById,
        lastCredentialInvalidation: user2.lastCredentialInvalidation,
      });

      const result = await userCommandRepo.updateUser(updatedUser2);
      expect(result.firstName).toBe("StillExists");

      const tryUpdateUser1 = new UserModel({
        id: user1.id,
        email: user1.email,
        firstName: "ShouldFail",
        lastName: user1.lastName,
        password: user1.password,
        active: user1.active,
        emailConfirmed: user1.emailConfirmed,
        createdAt: user1.createdAt,
        updatedAt: new Date(),
        invitedById: user1.invitedById,
        lastCredentialInvalidation: user1.lastCredentialInvalidation,
      });

      await expect(userCommandRepo.updateUser(tryUpdateUser1)).rejects.toThrow(UserNotFoundError);
    });
  });

  describe("Integration Tests", () => {
    it("TC014: Should create, update, and delete user in sequence", async () => {
      // Arrange
      const initialData = {
        email: "lifecycle@example.com",
        firstName: "Initial",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: false,
      };

      // Act & Assert
      const user = new UserModel(initialData);
      const createdUser = await userCommandRepo.createUser(user);

      expect(createdUser.email).toBe(initialData.email);
      expect(createdUser.firstName).toBe(initialData.firstName);

      // Act & Assert
      const updatedUser = new UserModel({
        id: createdUser.id,
        email: createdUser.email,
        firstName: "Updated",
        lastName: createdUser.lastName,
        password: createdUser.password,
        active: createdUser.active,
        emailConfirmed: true,
        createdAt: createdUser.createdAt,
        updatedAt: new Date(),
        invitedById: createdUser.invitedById,
        lastCredentialInvalidation: createdUser.lastCredentialInvalidation,
      });

      const updatedResult = await userCommandRepo.updateUser(updatedUser);
      expect(updatedResult.firstName).toBe("Updated");
      expect(updatedResult.emailConfirmed).toBe(true);

      // Act & Assert
      await userCommandRepo.deleteUser(createdUser.id);

      const deletedCheck = new UserModel({
        id: updatedResult.id,
        email: updatedResult.email,
        firstName: "ShouldFail",
        lastName: updatedResult.lastName,
        password: updatedResult.password,
        active: updatedResult.active,
        emailConfirmed: updatedResult.emailConfirmed,
        createdAt: updatedResult.createdAt,
        updatedAt: new Date(),
        invitedById: updatedResult.invitedById,
        lastCredentialInvalidation: updatedResult.lastCredentialInvalidation,
      });

      await expect(userCommandRepo.updateUser(deletedCheck)).rejects.toThrow(UserNotFoundError);
    });

    it("TC015: Should handle operations on multiple users independently", async () => {
      // Arrange
      const usersData = [
        {
          email: "multi1@example.com",
          password: "$2b$10$hashedPassword123456789",
          active: true,
          emailConfirmed: false,
        },
        {
          email: "multi2@example.com",
          password: "$2b$10$hashedPassword123456789",
          active: false,
          emailConfirmed: true,
        },
        {
          email: "multi3@example.com",
          password: "$2b$10$hashedPassword123456789",
          active: true,
          emailConfirmed: false,
        },
      ];

      // Act
      const createdUsers = await Promise.all(
        usersData.map(data => userCommandRepo.createUser(new UserModel(data))),
      );

      // Assert
      expect(createdUsers).toHaveLength(3);
      createdUsers.forEach((user, index) => {
        expect(user.email).toBe(usersData[index].email);
        expect(user.active).toBe(usersData[index].active);
        expect(user.emailConfirmed).toBe(usersData[index].emailConfirmed);
      });

      // Act
      const updatedMiddleUser = new UserModel({
        id: createdUsers[1].id,
        email: createdUsers[1].email,
        firstName: "MiddleUpdated",
        lastName: createdUsers[1].lastName,
        password: createdUsers[1].password,
        active: createdUsers[1].active,
        emailConfirmed: createdUsers[1].emailConfirmed,
        createdAt: createdUsers[1].createdAt,
        updatedAt: new Date(),
        invitedById: createdUsers[1].invitedById,
        lastCredentialInvalidation: createdUsers[1].lastCredentialInvalidation,
      });

      const updateResult = await userCommandRepo.updateUser(updatedMiddleUser);
      expect(updateResult.firstName).toBe("MiddleUpdated");

      // Act
      await userCommandRepo.deleteUser(createdUsers[2].id);

      // Assert
      const updatedFirstUser = new UserModel({
        id: createdUsers[0].id,
        email: createdUsers[0].email,
        firstName: createdUsers[0].firstName,
        lastName: "FirstStillExists",
        password: createdUsers[0].password,
        active: createdUsers[0].active,
        emailConfirmed: createdUsers[0].emailConfirmed,
        createdAt: createdUsers[0].createdAt,
        updatedAt: new Date(),
        invitedById: createdUsers[0].invitedById,
        lastCredentialInvalidation: createdUsers[0].lastCredentialInvalidation,
      });

      const firstResult = await userCommandRepo.updateUser(updatedFirstUser);
      expect(firstResult.lastName).toBe("FirstStillExists");

      // Assert
      const tryUpdateLast = new UserModel({
        id: createdUsers[2].id,
        email: createdUsers[2].email,
        firstName: createdUsers[2].firstName,
        lastName: "ShouldFail",
        password: createdUsers[2].password,
        active: createdUsers[2].active,
        emailConfirmed: createdUsers[2].emailConfirmed,
        createdAt: createdUsers[2].createdAt,
        updatedAt: new Date(),
        invitedById: createdUsers[2].invitedById,
        lastCredentialInvalidation: createdUsers[2].lastCredentialInvalidation,
      });

      await expect(userCommandRepo.updateUser(tryUpdateLast)).rejects.toThrow(UserNotFoundError);
    });

    it("TC016: Should maintain data types and constraints correctly", async () => {
      // Arrange
      const userData = {
        email: "types@example.com",
        firstName: "TypeTest",
        lastName: "User",
        password: "$2b$10$hashedPassword123456789",
        active: true,
        emailConfirmed: false,
        invitedById: uuidv7(),
        lastCredentialInvalidation: new Date("2023-01-01T12:00:00.000Z"),
      };

      // Act
      const user = new UserModel(userData);
      const result = await userCommandRepo.createUser(user);

      // Assert
      expect(typeof result.id).toBe("string");
      expect(typeof result.email).toBe("string");
      expect(typeof result.firstName).toBe("string");
      expect(typeof result.lastName).toBe("string");
      expect(typeof result.password).toBe("string");
      expect(typeof result.active).toBe("boolean");
      expect(typeof result.emailConfirmed).toBe("boolean");
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(typeof result.invitedById).toBe("string");
      expect(result.lastCredentialInvalidation).toBeInstanceOf(Date);

      expect(result.email).toBe(userData.email);
      expect(result.firstName).toBe(userData.firstName);
      expect(result.lastName).toBe(userData.lastName);
      expect(result.active).toBe(userData.active);
      expect(result.emailConfirmed).toBe(userData.emailConfirmed);
      expect(result.invitedById).toBe(userData.invitedById);
      expect(result.lastCredentialInvalidation).toEqual(userData.lastCredentialInvalidation);
    });
  });
});
