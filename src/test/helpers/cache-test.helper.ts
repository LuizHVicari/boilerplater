import { RedisContainer, StartedRedisContainer } from "@testcontainers/redis";
import Redis from "ioredis";

export class CacheTestHelper {
  private container: StartedRedisContainer | null = null;
  private client: Redis | null = null;

  async startContainer(): Promise<{ host: string; port: number; client: Redis }> {
    this.container = await new RedisContainer("valkey/valkey:7.2").start();

    const host = this.container.getHost();
    const port = this.container.getMappedPort(6379);

    this.client = new Redis({
      host,
      port,
    });

    await this.client.ping();

    return { host, port, client: this.client };
  }

  async clearCache(): Promise<void> {
    if (this.client) {
      await this.client.flushall();
    }
  }

  async stopContainer(): Promise<void> {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }

    if (this.container) {
      await this.container.stop();
      this.container = null;
    }
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error("Cache client not initialized. Call startContainer() first.");
    }
    return this.client;
  }
}
