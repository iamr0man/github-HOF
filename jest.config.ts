import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  verbose: true,
  transform: {
    '\\.ts$': 'ts-jest',
  },
  setupFiles: ['<rootDir>/.jest/setEnvVars.js'],
};
export default config;
