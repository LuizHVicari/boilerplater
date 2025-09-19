/*
  Test Cases for DrizzleUnitOfWork:
    Integration Tests with Real Database:
      1. **Successful Transaction Commit**: Should persist data when transaction completes successfully
      2. **Transaction Rollback on Error**: Should not persist data when work function throws error
      3. **Manual Rollback**: Should not persist data when cancel() is called
      4. **Multiple Operations**: Should handle multiple repository operations within single transaction
      5. **Concurrent Transactions**: Should isolate concurrent transactions properly
      6. **Complex Workflow**: Should handle real-world workflow with validation and business logic
*/

import { count, eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { usersTable } from "src/db/schema";
import { UserCommandDrizzleRepo } from "src/modules/users/application/adapters/user-command-drizzle-repo.service";
import { UserModel } from "src/modules/users/domain/models/user.model";
import { DatabaseTestHelper } from "src/test/helpers/database-test.helper";

import { RepositoryContext, UnitOfWork } from "../ports/unit-of-work.service";

// Custom UnitOfWork for testing that uses our test database
class TestDrizzleUnitOfWork implements UnitOfWork {
  constructor(private readonly testDb: NodePgDatabase) {}

  execute<T>(work: (ctx: RepositoryContext) => Promise<T>): Promise<T> {
    return this.testDb.transaction(async (tx): Promise<T> => {
      const ctx: RepositoryContext = {
        userCommandRepository: new UserCommandDrizzleRepo(tx),
        cancel: () => {
          return tx.rollback();
        },
      };

      return await work(ctx);
    });
  }
}

describe("DrizzleUnitOfWork - Integration Tests", () => {
  let dbHelper: DatabaseTestHelper;
  let testDb: NodePgDatabase;
  let unitOfWork: TestDrizzleUnitOfWork;

  beforeAll(async () => {
    dbHelper = new DatabaseTestHelper();
    const { db } = await dbHelper.startContainer();
    testDb = db;
    unitOfWork = new TestDrizzleUnitOfWork(testDb);
  }, 60000);

  beforeEach(async () => {
    await dbHelper.clearDatabase();
  });

  afterAll(async () => {
    await dbHelper.stopContainer();
  });

  describe("Transaction Management", () => {
    it("TC001: Should persist data when transaction completes successfully", async () => {
      const testUser = new UserModel({
        email: "success@example.com",
        password: "$2b$10$validHashForSuccess",
        active: true,
        emailConfirmed: false,
      });

      // Execute work that should succeed
      const result = await unitOfWork.execute(async (ctx: RepositoryContext) => {
        await ctx.userCommandRepository.createUser(testUser);
        return "transaction-success";
      });

      // Verify transaction succeeded
      expect(result).toBe("transaction-success");

      // Verify data was persisted
      const savedUsers = await testDb
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, "success@example.com"));
      expect(savedUsers).toHaveLength(1);
      expect(savedUsers[0].email).toBe("success@example.com");
      expect(savedUsers[0].active).toBe(true);
    });

    it("TC002: Should not persist data when work function throws error", async () => {
      const testUser = new UserModel({
        email: "error@example.com",
        password: "$2b$10$validHashForError",
        active: true,
        emailConfirmed: false,
      });

      // Execute work that should fail
      await expect(
        unitOfWork.execute(async (ctx: RepositoryContext) => {
          await ctx.userCommandRepository.createUser(testUser);
          throw new Error("Intentional failure after user creation");
        }),
      ).rejects.toThrow("Intentional failure after user creation");

      // Verify data was NOT persisted
      const savedUsers = await testDb
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, "error@example.com"));
      expect(savedUsers).toHaveLength(0);
    });

    it("TC003: Should not persist data when cancel() is called", async () => {
      const testUser = new UserModel({
        email: "cancel@example.com",
        password: "$2b$10$validHashForCancel",
        active: true,
        emailConfirmed: false,
      });

      // Execute work that calls cancel - should throw rollback error
      await expect(
        unitOfWork.execute(async (ctx: RepositoryContext) => {
          await ctx.userCommandRepository.createUser(testUser);
          await ctx.cancel(); // Manual rollback - this throws
          return "should-not-reach";
        }),
      ).rejects.toThrow("Rollback");

      // Verify data was NOT persisted
      const savedUsers = await testDb
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, "cancel@example.com"));
      expect(savedUsers).toHaveLength(0);
    });

    it("TC004: Should handle multiple repository operations within single transaction", async () => {
      const user1 = new UserModel({
        email: "multi1@example.com",
        password: "$2b$10$validHashForMulti1",
        active: true,
        emailConfirmed: false,
      });

      const user2 = new UserModel({
        email: "multi2@example.com",
        password: "$2b$10$validHashForMulti2",
        active: false,
        emailConfirmed: true,
      });

      // Execute multiple operations in one transaction
      const result = await unitOfWork.execute(async (ctx: RepositoryContext) => {
        await ctx.userCommandRepository.createUser(user1);
        await ctx.userCommandRepository.createUser(user2);

        // Update user1
        user1.activate();
        user1.confirmEmail();
        await ctx.userCommandRepository.updateUser(user1);

        return "multi-ops-success";
      });

      expect(result).toBe("multi-ops-success");

      // Verify both users were persisted
      const totalUsers = await testDb.select({ count: count() }).from(usersTable);
      expect(totalUsers[0].count).toBe(2);

      // Verify user1 updates were persisted
      const user1Data = await testDb
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, "multi1@example.com"));
      expect(user1Data[0].active).toBe(true);
      expect(user1Data[0].emailConfirmed).toBe(true);
    });

    it("TC005: Should isolate concurrent transactions properly", async () => {
      const user1 = new UserModel({
        email: "concurrent1@example.com",
        password: "$2b$10$validHashForConcurrent1",
        active: true,
        emailConfirmed: false,
      });

      const user2 = new UserModel({
        email: "concurrent2@example.com",
        password: "$2b$10$validHashForConcurrent2",
        active: true,
        emailConfirmed: false,
      });

      // Execute concurrent transactions
      const [result1, result2] = await Promise.all([
        unitOfWork.execute(async (ctx: RepositoryContext) => {
          await ctx.userCommandRepository.createUser(user1);
          await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
          return "concurrent-1";
        }),
        unitOfWork.execute(async (ctx: RepositoryContext) => {
          await ctx.userCommandRepository.createUser(user2);
          await new Promise(resolve => setTimeout(resolve, 5)); // Small delay
          return "concurrent-2";
        }),
      ]);

      expect(result1).toBe("concurrent-1");
      expect(result2).toBe("concurrent-2");

      // Verify both users were persisted
      const totalUsers = await testDb.select({ count: count() }).from(usersTable);
      expect(totalUsers[0].count).toBe(2);
    });

    it("TC006: Should handle real-world workflow with validation and business logic", async () => {
      const user = new UserModel({
        email: "workflow@example.com",
        password: "$2b$10$validHashForWorkflow",
        active: false,
        emailConfirmed: false,
      });

      // Complex workflow: create user, activate, confirm email, update password
      const result = await unitOfWork.execute(async (ctx: RepositoryContext) => {
        // Create user
        await ctx.userCommandRepository.createUser(user);

        // Business logic: activate user
        user.activate();
        await ctx.userCommandRepository.updateUser(user);

        // Business logic: confirm email
        user.confirmEmail();
        await ctx.userCommandRepository.updateUser(user);

        // Business logic: update password
        user.updatePassword("$2b$10$newValidHashForWorkflow");
        await ctx.userCommandRepository.updateUser(user);

        // Verify business rules
        if (!user.canAuthenticate()) {
          throw new Error("User should be able to authenticate");
        }

        return {
          userId: user.id,
          canAuth: user.canAuthenticate(),
          isActive: user.active,
          emailConfirmed: user.emailConfirmed,
        };
      });

      // Verify result
      expect(result.canAuth).toBe(true);
      expect(result.isActive).toBe(true);
      expect(result.emailConfirmed).toBe(true);

      // Verify final state in database
      const savedUser = await testDb
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, "workflow@example.com"));
      expect(savedUser[0].active).toBe(true);
      expect(savedUser[0].emailConfirmed).toBe(true);
      expect(savedUser[0].password).toBe("$2b$10$newValidHashForWorkflow");
      expect(savedUser[0].lastCredentialInvalidation).toBeDefined();
    });
  });
});
