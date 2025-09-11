import { Inject, Injectable } from "@nestjs/common";
import { type ConfigType } from "@nestjs/config";
import Redis from "ioredis";
import cacheConfig from "src/modules/common/config/cache.config";

import { CacheService } from "../ports/cache.service";

const DEFAULT_TTL_SECONDS = 60;

@Injectable()
export class ValkeyCacheService implements CacheService {
  private readonly client: Redis;

  constructor(
    @Inject(cacheConfig.KEY)
    private readonly cacheSettings: ConfigType<typeof cacheConfig>,
  ) {
    this.client = new Redis({
      host: this.cacheSettings.host,
      port: this.cacheSettings.port,
      password: this.cacheSettings.password,
    });
  }
  async get<T>(key: string): Promise<T | undefined> {
    const data = await this.client.get(key);
    return data ? (JSON.parse(data) as T) : undefined;
  }

  async set<T>(key: string, value: T, ttlSeconds = DEFAULT_TTL_SECONDS): Promise<void> {
    await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async getMany<T>(pattern: string): Promise<T[]> {
    const stream: AsyncIterable<string[]> = this.client.scanStream({ match: pattern });
    const results: T[] = [];

    for await (const keys of stream) {
      if (keys.length) {
        const values = await this.client.mget(...keys);
        values.forEach(v => v && results.push(JSON.parse(v) as T));
      }
    }

    return results;
  }
  async deleteMany(pattern: string): Promise<void> {
    const stream: AsyncIterable<string[]> = this.client.scanStream({ match: pattern });

    for await (const keys of stream) {
      if (keys.length) {
        await this.client.del(...keys);
      }
    }
  }
}
