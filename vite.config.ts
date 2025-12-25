import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@core': path.resolve(__dirname, './src/core'),
            '@app': path.resolve(__dirname, './src/app'),
            '@ui': path.resolve(__dirname, './src/ui'),
            '@infra': path.resolve(__dirname, './src/infra'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        include: ['src/**/*.test.{ts,tsx}'],
        exclude: ['node_modules', 'tests/integration'],
    },
});
