import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function readDirectoriesRecursively(dirPath: string, basePath: string = ''): any[] {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  const result: any[] = [];

  items.forEach((item) => {
    const fullPath = path.join(dirPath, item.name);
    const relativePath = basePath ? `${basePath}/${item.name}` : item.name;

    if (item.isDirectory()) {
      const subdirs = readDirectoriesRecursively(fullPath, relativePath);
      const files = fs.readdirSync(fullPath)
        .filter((file) => file.endsWith('.json'))
        .sort();

      if (files.length > 0 || subdirs.length > 0) {
        result.push({
          name: item.name,
          path: relativePath,
          files: files,
          subdirectories: subdirs,
        });
      }
    }
  });

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-handler',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/files') {
            const dataDir = path.join(process.cwd(), 'public', 'data');

            try {
              if (!fs.existsSync(dataDir)) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ directories: [] }));
                return;
              }

              const directories = readDirectoriesRecursively(dataDir);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ directories }));
            } catch (error) {
              console.error('Error reading directories:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to read directories' }));
            }
            return;
          }
          next();
        });
      },
    },
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
