import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
    server: {
        port: 3032,
        open: true,
    },
});
