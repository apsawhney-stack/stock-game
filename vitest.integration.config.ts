import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@core': resolve(__dirname, 'src/core'),
            '@app': resolve(__dirname, 'src/app'),
            '@ui': resolve(__dirname, 'src/ui'),
            '@infra': resolve(__dirname, 'src/infra'),
            '@data': resolve(__dirname, 'data'),
        },
    },
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.integration.test.ts', 'tests/**/*.test.ts'],
        testTimeout: 30000,
    },
});
