
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';

  export default defineConfig({
    plugins: [react()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        'figma:asset/bcca83482c8b3b02fad6bfe11da57e59506831e5.png': path.resolve(__dirname, './src/assets/bcca83482c8b3b02fad6bfe11da57e59506831e5.png'),
        'figma:asset/b9ee1e83da37e8d99fdb6bc684feefadda356498.png': path.resolve(__dirname, './src/assets/b9ee1e83da37e8d99fdb6bc684feefadda356498.png'),
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
    },
    server: {
      port: 3000,
      open: true,
      host: true, // Enable all hosts
      strictPort: true,
      proxy: {},
    },
  });