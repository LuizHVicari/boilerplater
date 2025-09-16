import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
    '^@common/(.*)$': '<rootDir>/modules/common/$1',
    '^@users/(.*)$': '<rootDir>/modules/users/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
  forceExit: true,
  detectOpenHandles: true,
};

export default config;