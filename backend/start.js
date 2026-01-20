#!/usr/bin/env node
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(__dirname);

// Now import and run the server
import('./dist/server.js').catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
