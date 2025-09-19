/*
Test Cases for CacheTokenInvalidationRepoService:
  Method Name: verifyTokenValid
    Method Purpose: Check if token is valid by consulting cache invalidation records

    1. **Happy Path**: Should return true when token is valid (no invalidation records)
    2. **JTI Invalidation**: Should return false when specific token JTI is invalidated
    3. **Type Invalidation - Before**: Should return false when token issued before type invalidation
    4. **Type Invalidation - After**: Should return true when token issued after type invalidation
    5. **All Token Invalidation - Before**: Should return false when token issued before all-tokens invalidation
    6. **All Token Invalidation - After**: Should return true when token issued after all-tokens invalidation
    7. **⚠️ CRITICAL Timing Issue - Same Second**: Should return true when token issued at EXACT same second as invalidation
    8. **⚠️ CRITICAL Timing Issue - One Second After**: Should return true when token issued 1 second after invalidation
    9. **⚠️ CRITICAL Timing Issue - One Second Before**: Should return false when token issued 1 second before invalidation
    10. **Multiple Invalidations**: Should handle multiple invalidation types correctly

  Method Name: invalidateToken
    Method Purpose: Add specific token to invalidation cache

    11. **Happy Path**: Should invalidate specific token by JTI
    12. **TTL Verification**: Should set correct TTL based on token type
    13. **Multiple Tokens**: Should invalidate multiple tokens independently

  Method Name: invalidateAllUserTokens
    Method Purpose: Invalidate all tokens for user (by type or all types)

    14. **All Types**: Should invalidate all user tokens when no type specified
    15. **Specific Type**: Should invalidate only tokens of specific type for user
    16. **TTL Verification**: Should set correct TTL based on token type
    17. **Timing Precision**: Should use current second timestamp for invalidation

  Integration Tests:
    18. **Complex Scenario**: Should handle combination of different invalidation types
    19. **Performance**: Should handle high volume of invalidation checks efficiently
    20. **TTL Expiration**: Should respect TTL and clean up expired invalidation records
*/

import { ValkeyCacheService } from "src/modules/common/application/adapters/valkey-cache.service";
import { AuthToken } from "src/modules/users/domain/value-objects/auth-token.vo";
import { CacheTestHelper } from "src/test/helpers/cache-test.helper";
import { TimeTestUtils } from "src/test/utils/time.utils";

import { CacheTokenInvalidationRepoService } from "./cache-token-invalidation-repo.service";

describe("CacheTokenInvalidationRepoService", () => {
  let tokenInvalidationRepo: CacheTokenInvalidationRepoService;
  let cacheHelper: CacheTestHelper;
  let mockJwtConfig: any;

  beforeAll(async () => {
    cacheHelper = new CacheTestHelper();
    const { host, port } = await cacheHelper.startContainer();

    const mockCacheConfig = {
      host,
      port,
      password: "",
    };

    mockJwtConfig = {
      accessTokenTtl: 900, // 15 minutes
      refreshTokenTtl: 604800, // 7 days
      emailVerificationTokenTtl: 86400, // 24 hours
      passwordResetTokenTtl: 3600, // 1 hour
    };

    const cacheService = new ValkeyCacheService(mockCacheConfig);

    tokenInvalidationRepo = new CacheTokenInvalidationRepoService(cacheService, mockJwtConfig);
  }, 30000);

  afterAll(async () => {
    await cacheHelper.stopContainer();
  }, 10000);

  beforeEach(async () => {
    await cacheHelper.clearCache();
  });

  describe("verifyTokenValid", () => {
    it("TC001: Should return true when token is valid (no invalidation records)", async () => {
      // Arrange
      const token = new AuthToken({
        sub: "user-123",
        iat: TimeTestUtils.getCurrentUnixTimestamp(),
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
        jti: "jti-valid-token",
        type: "access",
      });

      // Act
      const result = await tokenInvalidationRepo.verifyTokenValid(token);

      // Assert
      expect(result).toBe(true);
    });

    it("TC002: Should return false when specific token JTI is invalidated", async () => {
      // Arrange
      const token = new AuthToken({
        sub: "user-123",
        iat: TimeTestUtils.getCurrentUnixTimestamp(),
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
        jti: "jti-invalidated",
        type: "access",
      });

      // Invalidate the specific token
      await tokenInvalidationRepo.invalidateToken(token);

      // Act
      const result = await tokenInvalidationRepo.verifyTokenValid(token);

      // Assert
      expect(result).toBe(false);
    });

    it("TC003: Should return false when token issued before type invalidation", async () => {
      // Arrange
      const invalidationTime = TimeTestUtils.getCurrentUnixTimestamp();
      const tokenIssuedBefore = invalidationTime - 10; // 10 seconds before invalidation

      const token = new AuthToken({
        sub: "user-123",
        iat: tokenIssuedBefore,
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
        jti: "jti-before-invalidation",
        type: "access",
      });

      // Invalidate all access tokens for user at specific time
      await tokenInvalidationRepo.invalidateAllUserTokens("user-123", "access");

      // Act
      const result = await tokenInvalidationRepo.verifyTokenValid(token);

      // Assert
      expect(result).toBe(false);
    });

    it("TC004: Should return true when token issued after type invalidation", async () => {
      // Arrange - First invalidate at current time
      const invalidationTime = TimeTestUtils.getCurrentUnixTimestamp();
      await tokenInvalidationRepo.invalidateAllUserTokens("user-123", "access");

      // Wait for next second to ensure token is issued after invalidation
      const tokenIat = await TimeTestUtils.waitForNextSecond();

      const token = new AuthToken({
        sub: "user-123",
        iat: tokenIat,
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
        jti: "jti-after-invalidation",
        type: "access",
      });

      // Act
      const result = await tokenInvalidationRepo.verifyTokenValid(token);

      // Assert
      expect(result).toBe(true);
      expect(tokenIat).toBeGreaterThan(invalidationTime);
    });

    it("TC005: Should return false when token issued before all-tokens invalidation", async () => {
      // Arrange
      const invalidationTime = TimeTestUtils.getCurrentUnixTimestamp();
      const tokenIssuedBefore = invalidationTime - 5;

      const token = new AuthToken({
        sub: "user-123",
        iat: tokenIssuedBefore,
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
        jti: "jti-before-all-invalidation",
        type: "refresh",
      });

      // Invalidate ALL tokens for user
      await tokenInvalidationRepo.invalidateAllUserTokens("user-123");

      // Act
      const result = await tokenInvalidationRepo.verifyTokenValid(token);

      // Assert
      expect(result).toBe(false);
    });

    it("TC006: Should return true when token issued after all-tokens invalidation", async () => {
      // Arrange - First invalidate
      await tokenInvalidationRepo.invalidateAllUserTokens("user-123");

      // Wait and create token after invalidation
      const tokenIat = await TimeTestUtils.waitForNextSecond();

      const token = new AuthToken({
        sub: "user-123",
        iat: tokenIat,
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
        jti: "jti-after-all-invalidation",
        type: "refresh",
      });

      // Act
      const result = await tokenInvalidationRepo.verifyTokenValid(token);

      // Assert
      expect(result).toBe(true);
    });

    it("TC007: ⚠️ CRITICAL - Should return true when token issued at EXACT same second as invalidation", async () => {
      // Arrange
      const exactSecond = TimeTestUtils.getCurrentUnixTimestamp();

      // Create token at exact second
      const token = new AuthToken({
        sub: "user-123",
        iat: exactSecond,
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
        jti: "jti-exact-second",
        type: "access",
      });

      // Simulate invalidation at the exact same second
      const cacheService = (tokenInvalidationRepo as any).cacheService;
      await cacheService.set("all-user-tokens-invalidation:user-123:access", exactSecond, 900);

      // Act
      const result = await tokenInvalidationRepo.verifyTokenValid(token);

      // Assert - Token should be VALID because iat >= invalidationTime (not strictly >)
      expect(result).toBe(true);
    });

    it("TC008: ⚠️ CRITICAL - Should return true when token issued 1 second after invalidation", async () => {
      // Arrange
      const invalidationTime = TimeTestUtils.getCurrentUnixTimestamp();
      const tokenTime = invalidationTime + 1;

      const token = new AuthToken({
        sub: "user-123",
        iat: tokenTime,
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
        jti: "jti-one-second-after",
        type: "access",
      });

      // Set invalidation at earlier time
      const cacheService = (tokenInvalidationRepo as any).cacheService;
      await cacheService.set("all-user-tokens-invalidation:user-123:access", invalidationTime, 900);

      // Act
      const result = await tokenInvalidationRepo.verifyTokenValid(token);

      // Assert
      expect(result).toBe(true);
      expect(TimeTestUtils.verifyTokenValidAfterInvalidation(tokenTime, invalidationTime)).toBe(
        true,
      );
    });

    it("TC009: ⚠️ CRITICAL - Should return false when token issued 1 second before invalidation", async () => {
      // Arrange
      const invalidationTime = TimeTestUtils.getCurrentUnixTimestamp();
      const tokenTime = invalidationTime - 1;

      const token = new AuthToken({
        sub: "user-123",
        iat: tokenTime,
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
        jti: "jti-one-second-before",
        type: "access",
      });

      // Set invalidation at later time
      const cacheService = (tokenInvalidationRepo as any).cacheService;
      await cacheService.set("all-user-tokens-invalidation:user-123:access", invalidationTime, 900);

      // Act
      const result = await tokenInvalidationRepo.verifyTokenValid(token);

      // Assert
      expect(result).toBe(false);
      expect(TimeTestUtils.verifyTokenInvalidBeforeInvalidation(tokenTime, invalidationTime)).toBe(
        true,
      );
    });

    it("TC010: Should handle multiple invalidation types correctly", async () => {
      // Arrange
      const baseTime = TimeTestUtils.getCurrentUnixTimestamp();

      // Create tokens at different times
      const tokenBeforeAll = new AuthToken({
        sub: "user-123",
        iat: baseTime - 20,
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
        jti: "jti-before-all",
        type: "access",
      });

      const tokenBeforeType = new AuthToken({
        sub: "user-123",
        iat: baseTime - 10,
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
        jti: "jti-before-type",
        type: "access",
      });

      const tokenAfter = new AuthToken({
        sub: "user-123",
        iat: baseTime + 10,
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
        jti: "jti-after",
        type: "access",
      });

      // Set multiple invalidations
      const cacheService = (tokenInvalidationRepo as any).cacheService;
      await cacheService.set("all-user-tokens-invalidation:user-123:all", baseTime - 15, 900);
      await cacheService.set("all-user-tokens-invalidation:user-123:access", baseTime - 5, 900);

      // Act
      const resultBeforeAll = await tokenInvalidationRepo.verifyTokenValid(tokenBeforeAll);
      const resultBeforeType = await tokenInvalidationRepo.verifyTokenValid(tokenBeforeType);
      const resultAfter = await tokenInvalidationRepo.verifyTokenValid(tokenAfter);

      // Assert
      expect(resultBeforeAll).toBe(false); // Before all-tokens invalidation
      expect(resultBeforeType).toBe(false); // Before type-specific invalidation
      expect(resultAfter).toBe(true); // After all invalidations
    });
  });

  describe("invalidateToken", () => {
    it("TC011: Should invalidate specific token by JTI", async () => {
      // Arrange
      const token = new AuthToken({
        sub: "user-123",
        iat: TimeTestUtils.getCurrentUnixTimestamp(),
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
        jti: "jti-to-invalidate",
        type: "access",
      });

      // Act
      await tokenInvalidationRepo.invalidateToken(token);

      // Assert
      const result = await tokenInvalidationRepo.verifyTokenValid(token);
      expect(result).toBe(false);
    });

    it("TC012: Should set correct TTL based on token type", async () => {
      // Arrange
      const accessToken = new AuthToken({
        sub: "user-123",
        iat: TimeTestUtils.getCurrentUnixTimestamp(),
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
        jti: "jti-access",
        type: "access",
      });

      const refreshToken = new AuthToken({
        sub: "user-123",
        iat: TimeTestUtils.getCurrentUnixTimestamp(),
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(604800),
        jti: "jti-refresh",
        type: "refresh",
      });

      // Act
      await tokenInvalidationRepo.invalidateToken(accessToken);
      await tokenInvalidationRepo.invalidateToken(refreshToken);

      // Assert - Check TTL via Redis client
      const client = cacheHelper.getClient();
      const accessTtl = await client.ttl("single-token-invalidation:jti-access");
      const refreshTtl = await client.ttl("single-token-invalidation:jti-refresh");

      expect(accessTtl).toBeLessThanOrEqual(mockJwtConfig.accessTokenTtl);
      expect(refreshTtl).toBeLessThanOrEqual(mockJwtConfig.refreshTokenTtl);
      expect(refreshTtl).toBeGreaterThan(accessTtl);
    });

    it("TC013: Should invalidate multiple tokens independently", async () => {
      // Arrange
      const token1 = new AuthToken({
        sub: "user-123",
        iat: TimeTestUtils.getCurrentUnixTimestamp(),
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
        jti: "jti-1",
        type: "access",
      });

      const token2 = new AuthToken({
        sub: "user-123",
        iat: TimeTestUtils.getCurrentUnixTimestamp(),
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
        jti: "jti-2",
        type: "access",
      });

      // Act
      await tokenInvalidationRepo.invalidateToken(token1);

      // Assert
      const result1 = await tokenInvalidationRepo.verifyTokenValid(token1);
      const result2 = await tokenInvalidationRepo.verifyTokenValid(token2);

      expect(result1).toBe(false);
      expect(result2).toBe(true);
    });
  });

  describe("invalidateAllUserTokens", () => {
    it("TC014: Should invalidate all user tokens when no type specified", async () => {
      // Arrange
      const accessToken = new AuthToken({
        sub: "user-123",
        iat: TimeTestUtils.getUnixTimestampSecondsAgo(10),
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
        jti: "jti-access",
        type: "access",
      });

      const refreshToken = new AuthToken({
        sub: "user-123",
        iat: TimeTestUtils.getUnixTimestampSecondsAgo(10),
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(604800),
        jti: "jti-refresh",
        type: "refresh",
      });

      // Act
      await tokenInvalidationRepo.invalidateAllUserTokens("user-123");

      // Assert
      const accessResult = await tokenInvalidationRepo.verifyTokenValid(accessToken);
      const refreshResult = await tokenInvalidationRepo.verifyTokenValid(refreshToken);

      expect(accessResult).toBe(false);
      expect(refreshResult).toBe(false);
    });

    it("TC015: Should invalidate only tokens of specific type for user", async () => {
      // Arrange
      const accessToken = new AuthToken({
        sub: "user-123",
        iat: TimeTestUtils.getUnixTimestampSecondsAgo(10),
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
        jti: "jti-access",
        type: "access",
      });

      const refreshToken = new AuthToken({
        sub: "user-123",
        iat: TimeTestUtils.getUnixTimestampSecondsAgo(10),
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(604800),
        jti: "jti-refresh",
        type: "refresh",
      });

      // Act - Invalidate only access tokens
      await tokenInvalidationRepo.invalidateAllUserTokens("user-123", "access");

      // Assert
      const accessResult = await tokenInvalidationRepo.verifyTokenValid(accessToken);
      const refreshResult = await tokenInvalidationRepo.verifyTokenValid(refreshToken);

      expect(accessResult).toBe(false);
      expect(refreshResult).toBe(true); // Refresh should still be valid
    });

    it("TC016: Should set correct TTL based on token type", async () => {
      // Act
      await tokenInvalidationRepo.invalidateAllUserTokens("user-123", "access");
      await tokenInvalidationRepo.invalidateAllUserTokens("user-123", "refresh");

      // Assert - Check TTL via Redis client
      const client = cacheHelper.getClient();
      const accessTtl = await client.ttl("all-user-tokens-invalidation:user-123:access");
      const refreshTtl = await client.ttl("all-user-tokens-invalidation:user-123:refresh");

      expect(accessTtl).toBeLessThanOrEqual(mockJwtConfig.accessTokenTtl);
      expect(refreshTtl).toBeLessThanOrEqual(mockJwtConfig.refreshTokenTtl);
      expect(refreshTtl).toBeGreaterThan(accessTtl);
    });

    it("TC017: Should use current second timestamp for invalidation", async () => {
      // Arrange
      const beforeTime = TimeTestUtils.getCurrentUnixTimestamp();

      // Act
      await tokenInvalidationRepo.invalidateAllUserTokens("user-123", "access");

      // Assert - Get invalidation timestamp from cache
      const client = cacheHelper.getClient();
      const invalidationTimeStr = await client.get("all-user-tokens-invalidation:user-123:access");
      const invalidationTime = Math.floor(Number(invalidationTimeStr));

      expect(invalidationTime).toBeGreaterThanOrEqual(beforeTime);
      expect(invalidationTime).toBeLessThanOrEqual(TimeTestUtils.getCurrentUnixTimestamp());
    });
  });

  describe("Integration Tests", () => {
    it("TC018: Should handle combination of different invalidation types", async () => {
      // Arrange - Complex scenario with multiple invalidations
      const baseTime = TimeTestUtils.getCurrentUnixTimestamp();

      // Create various tokens
      const oldToken = new AuthToken({
        sub: "user-123",
        iat: baseTime - 100,
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
        jti: "jti-old",
        type: "access",
      });

      const mediumToken = new AuthToken({
        sub: "user-123",
        iat: baseTime - 50,
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
        jti: "jti-medium",
        type: "access",
      });

      const newToken = new AuthToken({
        sub: "user-123",
        iat: baseTime + 10,
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
        jti: "jti-new",
        type: "access",
      });

      // Apply different invalidations at different times
      const cacheService = (tokenInvalidationRepo as any).cacheService;
      await cacheService.set("all-user-tokens-invalidation:user-123:all", baseTime - 75, 3600);
      await cacheService.set("all-user-tokens-invalidation:user-123:access", baseTime - 25, 900);
      await tokenInvalidationRepo.invalidateToken(mediumToken); // Specific JTI invalidation

      // Act
      const oldResult = await tokenInvalidationRepo.verifyTokenValid(oldToken);
      const mediumResult = await tokenInvalidationRepo.verifyTokenValid(mediumToken);
      const newResult = await tokenInvalidationRepo.verifyTokenValid(newToken);

      // Assert
      expect(oldResult).toBe(false); // Invalid due to all-tokens invalidation
      expect(mediumResult).toBe(false); // Invalid due to specific JTI invalidation
      expect(newResult).toBe(true); // Valid - issued after all invalidations
    });

    it("TC019: Should handle high volume of invalidation checks efficiently", async () => {
      // Arrange
      const tokenCount = 100;
      const tokens: AuthToken[] = [];

      for (let i = 0; i < tokenCount; i++) {
        tokens.push(
          new AuthToken({
            sub: `user-${i}`,
            iat: TimeTestUtils.getCurrentUnixTimestamp(),
            exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
            jti: `jti-${i}`,
            type: "access",
          }),
        );
      }

      // Act - Measure performance
      const start = Date.now();
      const results = await Promise.all(
        tokens.map(token => tokenInvalidationRepo.verifyTokenValid(token)),
      );
      const duration = Date.now() - start;

      // Assert
      expect(results).toHaveLength(tokenCount);
      expect(results.every(result => result === true)).toBe(true); // All should be valid
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it("TC020: Should respect TTL and clean up expired invalidation records", async () => {
      // Arrange
      const shortTtl = 2; // 2 seconds
      const token = new AuthToken({
        sub: "user-123",
        iat: TimeTestUtils.getUnixTimestampSecondsAgo(10),
        exp: TimeTestUtils.getUnixTimestampSecondsFromNow(900),
        jti: "jti-ttl-test",
        type: "access",
      });

      // Manually set invalidation with short TTL
      const cacheService = (tokenInvalidationRepo as any).cacheService;
      await cacheService.set("single-token-invalidation:jti-ttl-test", "", shortTtl);

      // Assert - Should be invalid immediately
      const immediateResult = await tokenInvalidationRepo.verifyTokenValid(token);
      expect(immediateResult).toBe(false);

      // Wait for TTL expiration
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Assert - Should be valid after TTL expiration
      const expiredResult = await tokenInvalidationRepo.verifyTokenValid(token);
      expect(expiredResult).toBe(true);
    }, 10000);
  });
});
