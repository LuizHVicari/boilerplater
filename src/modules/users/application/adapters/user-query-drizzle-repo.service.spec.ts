/*
Test Cases for UserQueryDrizzleRepository:
  Method Name: findUserById
    Method Purpose: Find user by unique ID

    1. **Happy Path**: Should return user when ID exists
    2. **Not Found**: Should return undefined when ID does not exist
    3. **Data Integrity**: Should return complete user data with all fields
    4. **UUID Validation**: Should handle valid UUID formats correctly

  Method Name: findUserByEmail
    Method Purpose: Find user by unique email address

    5. **Happy Path**: Should return user when email exists
    6. **Not Found**: Should return undefined when email does not exist
    7. **Case Sensitivity**: Should handle email case sensitivity correctly
    8. **Data Integrity**: Should return complete user data with all fields

  Method Name: findUsers - Basic Functionality
    Method Purpose: Find users with filtering, pagination, and search

    9. **No Filters**: Should return all users when no filters provided
    10. **Empty Result**: Should return empty array when no users match filters
    11. **Count Accuracy**: Should return correct count even with pagination

  Method Name: findUsers - Pagination
    Method Purpose: Test limit/offset pagination functionality

    12. **Default Pagination**: Should handle undefined limit/offset with sensible defaults
    13. **Limit Only**: Should apply limit without offset (first N records)
    14. **Offset Only**: Should apply offset without limit (skip N records)
    15. **Limit + Offset**: Should apply both limit and offset correctly
    16. **Large Offset**: Should handle offset larger than total records
    17. **Zero Limit**: Should handle edge case of zero limit

  Method Name: findUsers - Search Functionality
    Method Purpose: Test text search across multiple fields

    18. **Search by firstName**: Should find users matching firstName pattern
    19. **Search by lastName**: Should find users matching lastName pattern
    20. **Search by email**: Should find users matching email pattern
    21. **Partial Match**: Should find users with partial text matches
    22. **Case Insensitive**: Should search case-insensitively
    23. **No Search Results**: Should return empty when search finds nothing
    24. **Multiple Fields Match**: Should find user when search matches multiple fields

  Method Name: findUsers - Field Filtering
    Method Purpose: Test exact field matching filters

    25. **Filter by firstName**: Should filter users by exact firstName
    26. **Filter by lastName**: Should filter users by exact lastName
    27. **Filter by email**: Should filter users by exact email
    28. **Filter by active**: Should filter users by active status
    29. **Filter by emailConfirmed**: Should filter users by email confirmation status
    30. **Filter by invitedById**: Should filter users by inviter ID
    31. **Multiple Field Filters**: Should combine multiple field filters with AND logic

  Method Name: findUsers - Date Range Filtering
    Method Purpose: Test date-based filtering functionality

    32. **createdAtGte**: Should filter users created on or after date
    33. **createdAtLte**: Should filter users created on or before date
    34. **createdAt Range**: Should filter users within creation date range
    35. **updatedAtGte**: Should filter users updated on or after date
    36. **updatedAtLte**: Should filter users updated on or before date
    37. **updatedAt Range**: Should filter users within update date range
    38. **Mixed Date Filters**: Should combine created/updated date filters

  Method Name: findUsers - Complex Combinations
    Method Purpose: Test combinations of different filter types

    39. **Search + Field Filters**: Should combine search with field filtering
    40. **Search + Date Filters**: Should combine search with date filtering
    41. **Field + Date Filters**: Should combine field and date filtering
    42. **All Filter Types**: Should combine search, field, and date filters
    43. **Pagination + Filters**: Should apply pagination to filtered results
    44. **Complex Real-world Scenario**: Should handle realistic complex query

  Method Name: findUsers - Ordering and Data Integrity
    Method Purpose: Test result ordering and data consistency

    45. **Default Ordering**: Should order results by createdAt by default
    46. **Consistent Ordering**: Should maintain consistent order across calls
    47. **Data Completeness**: Should return complete user objects in results
    48. **Count vs Data Consistency**: Should ensure count matches actual filterable records

  Integration and Performance Tests:
    49. **Large Dataset**: Should handle queries efficiently with many users (100+)
    50. **Concurrent Queries**: Should handle multiple simultaneous queries correctly
    51. **Database Constraints**: Should respect database constraints and indexes
    52. **Memory Efficiency**: Should not load excessive data into memory
*/

import { DatabaseTestHelper } from "src/test/helpers/database-test.helper";
import { v7 as uuidv7 } from "uuid";

import { UserModel } from "../../domain/models/user.model";
import { UserCommandDrizzleRepo } from "./user-command-drizzle-repo.service";
import { UserQueryDrizzleRepository } from "./user-query-drizzle-repo.service";

describe("UserQueryDrizzleRepository", () => {
  let userQueryRepo: UserQueryDrizzleRepository;
  let userCommandRepo: UserCommandDrizzleRepo;
  let databaseHelper: DatabaseTestHelper;

  beforeAll(async () => {
    databaseHelper = new DatabaseTestHelper();
    const { db } = await databaseHelper.startContainer();

    userQueryRepo = new UserQueryDrizzleRepository(db);
    userCommandRepo = new UserCommandDrizzleRepo(db); // For test data setup
  }, 60000);

  afterAll(async () => {
    await databaseHelper.stopContainer();
  }, 10000);

  beforeEach(async () => {
    await databaseHelper.clearDatabase();
  });

  // Test data setup helpers
  const createTestUser = async (overrides: Partial<any> = {}) => {
    const defaultUserData = {
      email: `user-${Date.now()}-${Math.random()}@example.com`,
      firstName: "Test",
      lastName: "User",
      password: "$2b$10$hashedPassword123456789",
      active: true,
      emailConfirmed: true,
      ...overrides,
    };

    const user = new UserModel(defaultUserData);
    return await userCommandRepo.createUser(user);
  };

  describe("findUserById", () => {
    it("TC001: Should return user when ID exists", async () => {
      // Arrange
      const createdUser = await createTestUser({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
      });

      // Act
      const result = await userQueryRepo.findUserById(createdUser.id);

      // Assert
      expect(result).toBeInstanceOf(UserModel);
      expect(result?.id).toBe(createdUser.id);
      expect(result?.email).toBe("john.doe@example.com");
      expect(result?.firstName).toBe("John");
      expect(result?.lastName).toBe("Doe");
    });

    it("TC002: Should return undefined when ID does not exist", async () => {
      // Arrange
      const nonExistentId = uuidv7();

      // Act
      const result = await userQueryRepo.findUserById(nonExistentId);

      // Assert
      expect(result).toBeUndefined();
    });

    it("TC003: Should return complete user data with all fields", async () => {
      // Arrange
      const inviterId = uuidv7();
      const createdUser = await createTestUser({
        firstName: "Complete",
        lastName: "User",
        email: "complete@example.com",
        active: false,
        emailConfirmed: false,
        invitedById: inviterId,
        lastCredentialInvalidation: new Date("2023-01-01T12:00:00.000Z"),
      });

      // Act
      const result = await userQueryRepo.findUserById(createdUser.id);

      // Assert
      expect(result).toBeInstanceOf(UserModel);
      expect(result?.firstName).toBe("Complete");
      expect(result?.lastName).toBe("User");
      expect(result?.email).toBe("complete@example.com");
      expect(result?.active).toBe(false);
      expect(result?.emailConfirmed).toBe(false);
      expect(result?.invitedById).toBe(inviterId);
      expect(result?.lastCredentialInvalidation).toEqual(new Date("2023-01-01T12:00:00.000Z"));
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it("TC004: Should handle valid UUID formats correctly", async () => {
      // Arrange
      const user1 = await createTestUser({ email: "uuid1@example.com" });
      const user2 = await createTestUser({ email: "uuid2@example.com" });

      // Act
      const result1 = await userQueryRepo.findUserById(user1.id);
      const result2 = await userQueryRepo.findUserById(user2.id);

      // Assert
      expect(result1?.id).toBe(user1.id);
      expect(result2?.id).toBe(user2.id);
      expect(result1?.email).toBe("uuid1@example.com");
      expect(result2?.email).toBe("uuid2@example.com");
    });
  });

  describe("findUserByEmail", () => {
    it("TC005: Should return user when email exists", async () => {
      // Arrange
      const createdUser = await createTestUser({
        firstName: "Email",
        lastName: "Test",
        email: "email.test@example.com",
      });

      // Act
      const result = await userQueryRepo.findUserByEmail("email.test@example.com");

      // Assert
      expect(result).toBeInstanceOf(UserModel);
      expect(result?.id).toBe(createdUser.id);
      expect(result?.email).toBe("email.test@example.com");
      expect(result?.firstName).toBe("Email");
      expect(result?.lastName).toBe("Test");
    });

    it("TC006: Should return undefined when email does not exist", async () => {
      // Arrange
      await createTestUser({ email: "existing@example.com" });

      // Act
      const result = await userQueryRepo.findUserByEmail("nonexistent@example.com");

      // Assert
      expect(result).toBeUndefined();
    });

    it("TC007: Should handle email case sensitivity correctly", async () => {
      // Arrange
      const createdUser = await createTestUser({
        email: "CaseSensitive@Example.COM",
      });

      // Act
      const result = await userQueryRepo.findUserByEmail("CaseSensitive@Example.COM");

      // Assert
      expect(result).toBeInstanceOf(UserModel);
      expect(result?.id).toBe(createdUser.id);
      expect(result?.email).toBe("CaseSensitive@Example.COM");
    });

    it("TC008: Should return complete user data with all fields", async () => {
      // Arrange
      const inviterId = uuidv7();
      const createdUser = await createTestUser({
        firstName: "Complete",
        lastName: "Email",
        email: "complete.email@example.com",
        active: false,
        emailConfirmed: false,
        invitedById: inviterId,
      });

      // Act
      const result = await userQueryRepo.findUserByEmail("complete.email@example.com");

      // Assert
      expect(result).toBeInstanceOf(UserModel);
      expect(result?.id).toBe(createdUser.id);
      expect(result?.firstName).toBe("Complete");
      expect(result?.lastName).toBe("Email");
      expect(result?.active).toBe(false);
      expect(result?.emailConfirmed).toBe(false);
      expect(result?.invitedById).toBe(inviterId);
    });
  });

  describe("findUsers - Basic Functionality", () => {
    it("TC009: Should return all users when no filters provided", async () => {
      // Arrange
      await createTestUser({ email: "user1@example.com", firstName: "User1" });
      await createTestUser({ email: "user2@example.com", firstName: "User2" });
      await createTestUser({ email: "user3@example.com", firstName: "User3" });

      // Act
      const result = await userQueryRepo.findUsers({});

      // Assert
      expect(result.data).toHaveLength(3);
      expect(result.count).toBe(3);
      expect(result.data.every(user => user instanceof UserModel)).toBe(true);
    });

    it("TC010: Should return empty array when no users match filters", async () => {
      // Arrange
      await createTestUser({ email: "active@example.com", active: true });
      await createTestUser({ email: "confirmed@example.com", emailConfirmed: true });

      // Act
      const result = await userQueryRepo.findUsers({ active: false, emailConfirmed: false });

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.count).toBe(0);
    });

    it("TC011: Should return correct count even with pagination", async () => {
      // Arrange
      for (let i = 0; i < 10; i++) {
        await createTestUser({ email: `user${i}@example.com` });
      }

      // Act
      const result = await userQueryRepo.findUsers({ limit: 3, offset: 2 });

      // Assert
      expect(result.data).toHaveLength(3); // Limited to 3
      expect(result.count).toBe(10); // Total count should be 10
    });
  });

  describe("findUsers - Pagination", () => {
    beforeEach(async () => {
      // Create 10 test users for pagination testing
      for (let i = 0; i < 10; i++) {
        await createTestUser({
          email: `pagination${i}@example.com`,
          firstName: `User${i}`,
        });
      }
    });

    it("TC012: Should handle undefined limit/offset with sensible defaults", async () => {
      // Act
      const result = await userQueryRepo.findUsers({});

      // Assert
      expect(result.data).toHaveLength(10); // Should return all users
      expect(result.count).toBe(10);
    });

    it("TC013: Should apply limit without offset (first N records)", async () => {
      // Act
      const result = await userQueryRepo.findUsers({ limit: 3 });

      // Assert
      expect(result.data).toHaveLength(3);
      expect(result.count).toBe(10);
      // Should be first 3 users (ordered by createdAt)
    });

    it("TC014: Should apply offset without limit (skip N records)", async () => {
      // Act
      const result = await userQueryRepo.findUsers({ offset: 3 });

      // Assert
      expect(result.data).toHaveLength(7); // 10 - 3 = 7
      expect(result.count).toBe(10);
    });

    it("TC015: Should apply both limit and offset correctly", async () => {
      // Act
      const result = await userQueryRepo.findUsers({ limit: 3, offset: 4 });

      // Assert
      expect(result.data).toHaveLength(3);
      expect(result.count).toBe(10);
    });

    it("TC016: Should handle offset larger than total records", async () => {
      // Act
      const result = await userQueryRepo.findUsers({ offset: 15 });

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.count).toBe(10);
    });

    it("TC017: Should handle edge case of zero limit", async () => {
      // Act
      const result = await userQueryRepo.findUsers({ limit: 0 });

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.count).toBe(10);
    });
  });

  describe("findUsers - Search Functionality", () => {
    beforeEach(async () => {
      await createTestUser({
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@company.com",
      });
      await createTestUser({
        firstName: "Jane",
        lastName: "Johnson",
        email: "jane.johnson@startup.io",
      });
      await createTestUser({
        firstName: "Bob",
        lastName: "Brown",
        email: "bob.brown@enterprise.org",
      });
    });

    it("TC018: Should find users matching firstName pattern", async () => {
      // Act
      const result = await userQueryRepo.findUsers({ search: "John" });

      // Assert
      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.data.some(user => user.firstName === "John")).toBe(true);
    });

    it("TC019: Should find users matching lastName pattern", async () => {
      // Act
      const result = await userQueryRepo.findUsers({ search: "Johnson" });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].lastName).toBe("Johnson");
    });

    it("TC020: Should find users matching email pattern", async () => {
      // Act
      const result = await userQueryRepo.findUsers({ search: "startup" });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toContain("startup");
    });

    it("TC021: Should find users with partial text matches", async () => {
      // Act
      const result = await userQueryRepo.findUsers({ search: "Joh" });

      // Assert
      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(
        result.data.some(user => user.firstName?.includes("Joh") ?? user.lastName?.includes("Joh")),
      ).toBe(true);
    });

    it("TC022: Should search case-insensitively", async () => {
      // Arrange - Create a user with unique case-sensitive name
      const uniqueName = `CaseTest${Date.now()}`;
      await createTestUser({
        firstName: uniqueName,
        lastName: "User",
        email: `${uniqueName.toLowerCase()}@example.com`,
      });

      // Act - Search with different case
      const lowerResult = await userQueryRepo.findUsers({ search: uniqueName.toLowerCase() });
      const upperResult = await userQueryRepo.findUsers({ search: uniqueName.toUpperCase() });

      // Assert - Both searches should find the user (case insensitive)
      expect(lowerResult.data.length).toBeGreaterThanOrEqual(1);
      expect(upperResult.data.length).toBeGreaterThanOrEqual(1);
      expect(
        lowerResult.data.some(user => user.firstName === uniqueName) ||
          upperResult.data.some(user => user.firstName === uniqueName),
      ).toBe(true);
    });

    it("TC023: Should return empty when search finds nothing", async () => {
      // Act
      const result = await userQueryRepo.findUsers({ search: "NonexistentName" });

      // Assert
      expect(result.data).toHaveLength(0);
      expect(result.count).toBe(0);
    });

    it("TC024: Should find user when search matches multiple fields", async () => {
      // Act - Search for "john" which appears in both firstName and email
      const result = await userQueryRepo.findUsers({ search: "john" });

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.data[0].firstName).toBe("John");
      expect(result.data[0].email).toContain("john");
    });
  });

  describe("findUsers - Field Filtering", () => {
    beforeEach(async () => {
      const inviterId = uuidv7();
      await createTestUser({
        firstName: "Alice",
        lastName: "Active",
        email: "alice@example.com",
        active: true,
        emailConfirmed: true,
        invitedById: inviterId,
      });
      await createTestUser({
        firstName: "Bob",
        lastName: "Inactive",
        email: "bob@example.com",
        active: false,
        emailConfirmed: false,
      });
      await createTestUser({
        firstName: "Charlie",
        lastName: "Mixed",
        email: "charlie@example.com",
        active: true,
        emailConfirmed: false,
        invitedById: inviterId,
      });
    });

    it("TC025: Should filter users by exact firstName", async () => {
      // Act
      const result = await userQueryRepo.findUsers({ firstName: "Alice" });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].firstName).toBe("Alice");
    });

    it("TC026: Should filter users by exact lastName", async () => {
      // Act
      const result = await userQueryRepo.findUsers({ lastName: "Inactive" });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].lastName).toBe("Inactive");
    });

    it("TC027: Should filter users by exact email", async () => {
      // Act
      const result = await userQueryRepo.findUsers({ email: "charlie@example.com" });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toBe("charlie@example.com");
    });

    it("TC028: Should filter users by active status", async () => {
      // Act
      const activeResult = await userQueryRepo.findUsers({ active: true });
      const inactiveResult = await userQueryRepo.findUsers({ active: false });

      // Assert
      expect(activeResult.data).toHaveLength(2);
      expect(inactiveResult.data).toHaveLength(1);
      expect(activeResult.data.every(user => user.active === true)).toBe(true);
      expect(inactiveResult.data.every(user => user.active === false)).toBe(true);
    });

    it("TC029: Should filter users by email confirmation status", async () => {
      // Act
      const confirmedResult = await userQueryRepo.findUsers({ emailConfirmed: true });
      const unconfirmedResult = await userQueryRepo.findUsers({ emailConfirmed: false });

      // Assert
      expect(confirmedResult.data).toHaveLength(1);
      expect(unconfirmedResult.data).toHaveLength(2);
      expect(confirmedResult.data[0].emailConfirmed).toBe(true);
      expect(unconfirmedResult.data.every(user => user.emailConfirmed === false)).toBe(true);
    });

    it("TC030: Should filter users by inviter ID", async () => {
      // Arrange - Get the inviterId from one of the created users
      const allUsers = await userQueryRepo.findUsers({});
      const userWithInviter = allUsers.data.find(user => user.invitedById);
      const inviterId = userWithInviter?.invitedById;

      // Act
      const result = await userQueryRepo.findUsers({ invitedById: inviterId });

      // Assert
      expect(result.data).toHaveLength(2); // Alice and Charlie
      expect(result.data.every(user => user.invitedById === inviterId)).toBe(true);
    });

    it("TC031: Should combine multiple field filters with AND logic", async () => {
      // Act
      const result = await userQueryRepo.findUsers({
        active: true,
        emailConfirmed: false,
      });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].firstName).toBe("Charlie");
      expect(result.data[0].active).toBe(true);
      expect(result.data[0].emailConfirmed).toBe(false);
    });
  });

  describe("findUsers - Date Range Filtering", () => {
    let user1: UserModel;
    let user2: UserModel;
    let user3: UserModel;

    beforeEach(async () => {
      // Create users with known timestamps
      user1 = await createTestUser({ email: "user1@example.com" });

      // Wait a bit and create second user
      await new Promise(resolve => setTimeout(resolve, 100));
      user2 = await createTestUser({ email: "user2@example.com" });

      // Wait a bit and create third user
      await new Promise(resolve => setTimeout(resolve, 100));
      user3 = await createTestUser({ email: "user3@example.com" });
    });

    it("TC032: Should filter users created on or after date", async () => {
      // Arrange
      const cutoffDate = new Date(user2.createdAt.getTime() - 50);

      // Act
      const result = await userQueryRepo.findUsers({ createdAtGte: cutoffDate });

      // Assert
      expect(result.data.length).toBeGreaterThanOrEqual(2); // Should include user2 and user3
      expect(result.data.every(user => user.createdAt >= cutoffDate)).toBe(true);
    });

    it("TC033: Should filter users created on or before date", async () => {
      // Arrange
      const cutoffDate = new Date(user2.createdAt.getTime() + 50);

      // Act
      const result = await userQueryRepo.findUsers({ createdAtLte: cutoffDate });

      // Assert
      expect(result.data.length).toBeGreaterThanOrEqual(2); // Should include user1 and user2
      expect(result.data.every(user => user.createdAt <= cutoffDate)).toBe(true);
    });

    it("TC034: Should filter users within creation date range", async () => {
      // Arrange
      const startDate = new Date(user1.createdAt.getTime() + 50);
      const endDate = new Date(user3.createdAt.getTime() - 50);

      // Act
      const result = await userQueryRepo.findUsers({
        createdAtGte: startDate,
        createdAtLte: endDate,
      });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toBe("user2@example.com");
    });

    it("TC035: Should filter users updated on or after date", async () => {
      // Arrange - Update user2 to change its updatedAt
      const updatedUser2 = new UserModel({
        id: user2.id,
        email: user2.email,
        firstName: "Updated",
        lastName: user2.lastName,
        password: user2.password,
        active: user2.active,
        emailConfirmed: user2.emailConfirmed,
        createdAt: user2.createdAt,
        updatedAt: new Date(),
        invitedById: user2.invitedById,
        lastCredentialInvalidation: user2.lastCredentialInvalidation,
      });

      await userCommandRepo.updateUser(updatedUser2);

      const cutoffDate = new Date(Date.now() - 1000);

      // Act
      const result = await userQueryRepo.findUsers({ updatedAtGte: cutoffDate });

      // Assert
      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.data.some(user => user.firstName === "Updated")).toBe(true);
    });

    it("TC036: Should filter users updated on or before date", async () => {
      // Arrange
      const pastDate = new Date(Date.now() - 10000);

      // Act
      const result = await userQueryRepo.findUsers({ updatedAtLte: pastDate });

      // Assert
      expect(result.data).toHaveLength(0); // All users created recently
    });

    it("TC037: Should filter users within update date range", async () => {
      // Arrange
      const startDate = new Date(Date.now() - 5000);
      const endDate = new Date(Date.now() + 1000);

      // Act
      const result = await userQueryRepo.findUsers({
        updatedAtGte: startDate,
        updatedAtLte: endDate,
      });

      // Assert
      expect(result.data).toHaveLength(3); // All users updated recently
    });

    it("TC038: Should combine created/updated date filters", async () => {
      // Arrange
      const recentDate = new Date(Date.now() - 5000);

      // Act
      const result = await userQueryRepo.findUsers({
        createdAtGte: recentDate,
        updatedAtGte: recentDate,
      });

      // Assert
      expect(result.data).toHaveLength(3); // All users are recent
    });
  });

  describe("findUsers - Complex Combinations", () => {
    let uniquePrefix: string;

    beforeEach(async () => {
      // Use unique prefix to avoid cross-contamination
      uniquePrefix = `test${Date.now()}`;

      await createTestUser({
        firstName: `${uniquePrefix}SearchActive`,
        lastName: "User",
        email: `${uniquePrefix}.search.active@example.com`,
        active: true,
        emailConfirmed: true,
      });
      await createTestUser({
        firstName: `${uniquePrefix}SearchInactive`,
        lastName: "User",
        email: `${uniquePrefix}.search.inactive@example.com`,
        active: false,
        emailConfirmed: false,
      });
      await createTestUser({
        firstName: `${uniquePrefix}NoSearch`,
        lastName: "Active",
        email: `${uniquePrefix}.nosearch.active@example.com`,
        active: true,
        emailConfirmed: true,
      });
    });

    it("TC039: Should combine search with field filtering", async () => {
      // Act
      const result = await userQueryRepo.findUsers({
        search: `${uniquePrefix}Search`,
        active: true,
      });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].firstName).toBe(`${uniquePrefix}SearchActive`);
    });

    it("TC040: Should combine search with date filtering", async () => {
      // Arrange
      const recentDate = new Date(Date.now() - 5000);

      // Act
      const result = await userQueryRepo.findUsers({
        search: `${uniquePrefix}Search`,
        createdAtGte: recentDate,
      });

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.data.every(user => user.firstName?.includes(`${uniquePrefix}Search`))).toBe(
        true,
      );
    });

    it("TC041: Should combine field and date filtering", async () => {
      // Arrange
      const recentDate = new Date(Date.now() - 5000);

      // Act
      const result = await userQueryRepo.findUsers({
        active: true,
        createdAtGte: recentDate,
      });

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.data.every(user => user.active === true)).toBe(true);
    });

    it("TC042: Should combine search, field, and date filters", async () => {
      // Arrange
      const recentDate = new Date(Date.now() - 5000);

      // Act
      const result = await userQueryRepo.findUsers({
        search: `${uniquePrefix}Search`,
        active: true,
        emailConfirmed: true,
        createdAtGte: recentDate,
      });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].firstName).toBe(`${uniquePrefix}SearchActive`);
    });

    it("TC043: Should apply pagination to filtered results", async () => {
      // Act
      const result = await userQueryRepo.findUsers({
        search: `${uniquePrefix}Search`,
        limit: 1,
        offset: 0,
      });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.count).toBe(2); // Total matching unique search term
    });

    it("TC044: Should handle realistic complex query", async () => {
      // Arrange - Complex real-world scenario
      const inviterId = uuidv7();
      await createTestUser({
        firstName: "Admin",
        lastName: "User",
        email: "admin@company.com",
        active: true,
        emailConfirmed: true,
        invitedById: inviterId,
      });

      const recentDate = new Date(Date.now() - 10000);

      // Act
      const result = await userQueryRepo.findUsers({
        search: "admin",
        active: true,
        emailConfirmed: true,
        invitedById: inviterId,
        createdAtGte: recentDate,
        limit: 10,
        offset: 0,
      });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].firstName).toBe("Admin");
      expect(result.count).toBe(1);
    });
  });

  describe("findUsers - Ordering and Data Integrity", () => {
    it("TC045: Should order results by createdAt by default", async () => {
      // Arrange
      await createTestUser({ email: "first@example.com" });
      await new Promise(resolve => setTimeout(resolve, 100));
      await createTestUser({ email: "second@example.com" });
      await new Promise(resolve => setTimeout(resolve, 100));
      await createTestUser({ email: "third@example.com" });

      // Act
      const result = await userQueryRepo.findUsers({});

      // Assert
      expect(result.data).toHaveLength(3);
      expect(result.data[0].createdAt <= result.data[1].createdAt).toBe(true);
      expect(result.data[1].createdAt <= result.data[2].createdAt).toBe(true);
    });

    it("TC046: Should maintain consistent order across calls", async () => {
      // Arrange
      for (let i = 0; i < 5; i++) {
        await createTestUser({ email: `order${i}@example.com` });
      }

      // Act
      const result1 = await userQueryRepo.findUsers({});
      const result2 = await userQueryRepo.findUsers({});

      // Assert
      expect(result1.data).toHaveLength(5);
      expect(result2.data).toHaveLength(5);

      for (let i = 0; i < 5; i++) {
        expect(result1.data[i].id).toBe(result2.data[i].id);
        expect(result1.data[i].email).toBe(result2.data[i].email);
      }
    });

    it("TC047: Should return complete user objects in results", async () => {
      // Arrange
      const inviterId = uuidv7();
      await createTestUser({
        firstName: "Complete",
        lastName: "DataCheck",
        email: "complete@example.com",
        active: true,
        emailConfirmed: false,
        invitedById: inviterId,
        lastCredentialInvalidation: new Date("2023-01-01T00:00:00.000Z"),
      });

      // Act
      const result = await userQueryRepo.findUsers({});

      // Assert
      expect(result.data).toHaveLength(1);
      const user = result.data[0];

      expect(user).toBeInstanceOf(UserModel);
      expect(typeof user.id).toBe("string");
      expect(typeof user.email).toBe("string");
      expect(typeof user.firstName).toBe("string");
      expect(typeof user.lastName).toBe("string");
      expect(typeof user.password).toBe("string");
      expect(typeof user.active).toBe("boolean");
      expect(typeof user.emailConfirmed).toBe("boolean");
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(typeof user.invitedById).toBe("string");
      expect(user.lastCredentialInvalidation).toBeInstanceOf(Date);
    });

    it("TC048: Should ensure count matches actual filterable records", async () => {
      // Arrange
      for (let i = 0; i < 7; i++) {
        await createTestUser({
          email: `count${i}@example.com`,
          active: i % 2 === 0, // Alternating active/inactive
        });
      }

      // Act
      const allResult = await userQueryRepo.findUsers({});
      const activeResult = await userQueryRepo.findUsers({ active: true });
      const inactiveResult = await userQueryRepo.findUsers({ active: false });

      // Assert
      expect(allResult.count).toBe(7);
      expect(activeResult.count + inactiveResult.count).toBe(allResult.count);
      expect(activeResult.data).toHaveLength(activeResult.count);
      expect(inactiveResult.data).toHaveLength(inactiveResult.count);
    });
  });

  describe("Integration and Performance Tests", () => {
    it("TC049: Should handle queries efficiently with many users (100+)", async () => {
      // Arrange
      const userCount = 100;
      const batchSize = 10;

      for (let batch = 0; batch < userCount / batchSize; batch++) {
        const promises: Array<Promise<UserModel>> = [];
        for (let i = 0; i < batchSize; i++) {
          const userIndex = batch * batchSize + i;
          promises.push(
            createTestUser({
              email: `bulk${userIndex}@example.com`,
              firstName: `User${userIndex}`,
              active: userIndex % 3 === 0,
            }),
          );
        }
        await Promise.all(promises);
      }

      // Act - Measure performance
      const start = Date.now();
      const result = await userQueryRepo.findUsers({
        active: true,
        limit: 20,
        offset: 10,
      });
      const duration = Date.now() - start;

      // Assert
      expect(result.data).toHaveLength(20);
      expect(result.count).toBeGreaterThan(30); // ~33% of 100 users should be active
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    }, 30000);

    it("TC050: Should handle multiple simultaneous queries correctly", async () => {
      // Arrange
      for (let i = 0; i < 20; i++) {
        await createTestUser({
          email: `concurrent${i}@example.com`,
          firstName: `User${i}`,
          active: i % 2 === 0,
        });
      }

      // Act - Run multiple queries simultaneously
      const queries = [
        userQueryRepo.findUsers({ active: true }),
        userQueryRepo.findUsers({ active: false }),
        userQueryRepo.findUsers({ search: "User" }),
        userQueryRepo.findUsers({ limit: 5, offset: 5 }),
        userQueryRepo.findUsers({}),
      ];

      const results = await Promise.all(queries);

      // Assert
      expect(results).toHaveLength(5);
      expect(results[0].data.every(user => user.active === true)).toBe(true);
      expect(results[1].data.every(user => user.active === false)).toBe(true);
      expect(results[2].data.every(user => user.firstName?.includes("User"))).toBe(true);
      expect(results[3].data).toHaveLength(5);
      expect(results[4].count).toBe(20);
    });

    it("TC051: Should respect database constraints and indexes", async () => {
      // Arrange
      const uniqueEmail = `unique${Date.now()}@example.com`;
      await createTestUser({ email: uniqueEmail });

      // Act - Try to create duplicate email (should fail at database level)
      await expect(createTestUser({ email: uniqueEmail })).rejects.toThrow();

      // Act - Query should still work correctly
      const result = await userQueryRepo.findUserByEmail(uniqueEmail);

      // Assert
      expect(result).toBeInstanceOf(UserModel);
      expect(result?.email).toBe(uniqueEmail);
    });

    it("TC052: Should not load excessive data into memory", async () => {
      // Arrange
      for (let i = 0; i < 50; i++) {
        await createTestUser({
          email: `memory${i}@example.com`,
          firstName: `User${i}`,
        });
      }

      // Act - Query with pagination should not load all records
      const smallResult = await userQueryRepo.findUsers({ limit: 5 });
      const largeResult = await userQueryRepo.findUsers({ limit: 40 });

      // Assert
      expect(smallResult.data).toHaveLength(5);
      expect(largeResult.data).toHaveLength(40);
      expect(smallResult.count).toBe(largeResult.count); // Same total count
      expect(smallResult.count).toBe(50);
    });
  });
});
