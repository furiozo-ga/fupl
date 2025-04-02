import { serve } from 'bun';
import { join, resolve } from 'path';
import { readDirectory, isPathSafe } from './fileUtils';
import { renderDirectoryListing } from './templates';

// Configuration
const PORT = process.env.PORT || 3000;
const ROOT_DIR = process.env.ROOT_DIR || './'; // Default to current directory
const ABSOLUTE_ROOT_DIR = resolve(ROOT_DIR);

serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = decodeURIComponent(url.pathname);

    // Handle static files
    if (pathname.startsWith('/public/')) {
      const publicPath = join(import.meta.dir, '..', pathname);
      const file = Bun.file(publicPath);
      if (await file.exists()) {
        return new Response(file);
      }
    }

    // Handle directory browsing
    try {
      // Normalize the path to prevent directory traversal attacks
      const relativePath = pathname === '/' ? '' : pathname.substring(1);
      const targetPath = join(ABSOLUTE_ROOT_DIR, relativePath);

      // Check if the path is safe (within the root directory)
      if (!isPathSafe(targetPath, ABSOLUTE_ROOT_DIR)) {
        return new Response('Access denied: Path is outside the root directory', { status: 403 });
      }

      // Check if the path exists and get stats
      try {
        const fileObj = Bun.file(targetPath);
        const stats = await fileObj.stat();

        // If it's a directory, show directory listing
        if (stats.isDirectory()) {
          const entries = await readDirectory(targetPath);
          const html = renderDirectoryListing(pathname, entries, relativePath);
          return new Response(html, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
            },
          });
        } else {
          // If it's a file, serve the file
          return new Response(fileObj);
        }
      } catch (fileError) {
        console.error('File error:', fileError);
        return new Response('Not found', { status: 404 });
      }
    } catch (error) {
      console.error('Error handling request:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
});

console.log(`Directory browser server running at http://localhost:${PORT}`);
console.log(`Serving files from: ${ABSOLUTE_ROOT_DIR}`);
