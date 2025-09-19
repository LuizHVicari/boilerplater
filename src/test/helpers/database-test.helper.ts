import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";

export class DatabaseTestHelper {
  private container: StartedPostgreSqlContainer | null = null;
  private client: Client | null = null;
  private db: NodePgDatabase | null = null;

  async startContainer(): Promise<{
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    db: NodePgDatabase;
  }> {
    this.container = await new PostgreSqlContainer("postgres:17")
      .withDatabase("test_db")
      .withUsername("test_user")
      .withPassword("test_password")
      .start();

    const host = this.container.getHost();
    const port = this.container.getMappedPort(5432);
    const database = this.container.getDatabase();
    const username = this.container.getUsername();
    const password = this.container.getPassword();

    this.client = new Client({
      host,
      port,
      database,
      user: username,
      password,
    });

    await this.client.connect();

    this.db = drizzle(this.client);

    // Run migrations to set up schema
    await this.runMigrations();

    return {
      host,
      port,
      database,
      username,
      password,
      db: this.db,
    };
  }

  async runMigrations(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized. Call startContainer() first.");
    }

    // Use Drizzle migrations - should work with the real migration files
    await migrate(this.db, { migrationsFolder: "./drizzle" });
  }

  async clearDatabase(): Promise<void> {
    if (!this.client) {
      throw new Error("Database client not initialized.");
    }

    // Clear all data from auth.user table (the real table name)
    await this.client.query("TRUNCATE TABLE auth.user CASCADE");
  }

  async stopContainer(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }

    if (this.container) {
      await this.container.stop();
      this.container = null;
    }

    this.db = null;
  }

  getDatabase(): NodePgDatabase {
    if (!this.db) {
      throw new Error("Database not initialized. Call startContainer() first.");
    }
    return this.db;
  }

  getClient(): Client {
    if (!this.client) {
      throw new Error("Database client not initialized. Call startContainer() first.");
    }
    return this.client;
  }
}
