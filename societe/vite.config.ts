
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';

  export default defineConfig({
    plugins: [react()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        'figma:asset/ddaf4c7eb0e28936f4d0223e859065e25d5c3fc8.png': path.resolve(__dirname, './src/assets/ddaf4c7eb0e28936f4d0223e859065e25d5c3fc8.png'),
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
    },
    server: {
      port: 3001,
      open: true,
    },
  });