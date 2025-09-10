export const CACHE_SERVICE = Symbol("CACHE_SERVICE");

export interface CacheService {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  getMany<T>(pattern: string): Promise<T[]>;
  deleteMany(pattern: string): Promise<void>;
}
