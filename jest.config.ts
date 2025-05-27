// jest.config.ts
export default {
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-jsdom', // Use the installed jsdom environment
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Optional: Add your setup file here
    moduleNameMapper: {
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy', // Mock CSS imports
    },
  };