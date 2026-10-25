// Demo mode: the real app with sample data and a signed-in demo user. No Firebase or database needed.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';
const root = path.resolve(import.meta.dirname, '..');
export default defineConfig({
  root,
  resolve: { alias: [
    { find: '@/context/AuthContext', replacement: path.join(root, 'demo/MockAuth.tsx') },
    { find: '@', replacement: path.join(root, 'src') },
  ] },
  server: { port: 5199, open: '/demo.html' },
  build: {
    outDir: path.join(root, 'dist-demo'),
    emptyOutDir: true,
    rolldownOptions: { input: path.join(root, 'demo.html') },
  },
  plugins: [react(), tailwindcss(), {
    name: 'demo-index',
    closeBundle() {
      // Static hosts look for index.html
      const out = path.join(root, 'dist-demo');
      if (fs.existsSync(path.join(out, 'demo.html'))) fs.renameSync(path.join(out, 'demo.html'), path.join(out, 'index.html'));
    },
  }],
});
