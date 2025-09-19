export class TimeTestUtils {
  static getCurrentUnixTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  static getUnixTimestampSecondsAgo(seconds: number): number {
    return this.getCurrentUnixTimestamp() - seconds;
  }

  static getUnixTimestampSecondsFromNow(seconds: number): number {
    return this.getCurrentUnixTimestamp() + seconds;
  }

  static async waitForNextSecond(): Promise<number> {
    const currentMs = Date.now();
    const currentSecond = Math.floor(currentMs / 1000);
    const nextSecond = currentSecond + 1;
    const waitTime = nextSecond * 1000 - currentMs;

    await this.sleep(waitTime);
    return nextSecond;
  }

  static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static createTokenAtExactSecond(second: number): {
    iat: number;
    jti: string;
    sub: string;
    type: string;
  } {
    return {
      iat: second,
      jti: `jti-${second}`,
      sub: "user-123",
      type: "access",
    };
  }

  static createInvalidationAtExactSecond(second: number): number {
    return second;
  }

  static verifyTokenValidAfterInvalidation(tokenIat: number, invalidationTime: number): boolean {
    return tokenIat >= invalidationTime;
  }

  static verifyTokenInvalidBeforeInvalidation(tokenIat: number, invalidationTime: number): boolean {
    return tokenIat < invalidationTime;
  }
}
