import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({
  // Path to your Next.js app — loads next.config.ts and .env.local in tests
  dir: "./",
});

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",

  // Run setup file after jest-environment is initialized
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // Module alias — mirrors tsconfig paths
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },

  // Collect coverage from these directories
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
};

export default createJestConfig(config);
