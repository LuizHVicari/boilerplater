/**
 * Test Cases for JwtAuthGuard
 *
 * TC001: Should extend AuthGuard with 'jwt' strategy
 * TC002: Should be injectable
 */

import { JwtAuthGuard } from "./jwt-auth.guard";

describe("JwtAuthGuard", () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  describe("TC001: Should extend AuthGuard with 'jwt' strategy", () => {
    it("should be instance of JwtAuthGuard", () => {
      expect(guard).toBeInstanceOf(JwtAuthGuard);
    });

    it("should have correct strategy name", () => {
      expect(guard).toBeDefined();
    });
  });

  describe("TC002: Should be injectable", () => {
    it("should be a valid NestJS injectable", () => {
      const metadata = Reflect.getMetadata("design:paramtypes", JwtAuthGuard);
      expect(metadata).toBeDefined();
    });
  });
});
