import { serve } from 'bun';
import { join, resolve } from 'path';
import { readDirectory, isPathSafe, isPubliclyReadable, setPublicReadable, isPubliclyWritable, setPublicWritable } from './fileUtils';
import { renderDirectoryListing, renderLoginPage } from './templates';
import { validateCredentials, createSession, validateSession, deleteSession } from './auth';

// Configuration
const PORT = process.env.PORT || 3000;
const ROOT = process.env.ROOT || join(import.meta.dir, '..', 'upload'); // Default to upload/ subdirectory
const ABSOLUTE_ROOT_DIR = resolve(ROOT);

serve({
  websocket: {
    message() {}
  },
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = decodeURIComponent(url.pathname);
    const method = req.method;

    // Parse cookies from request
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(cookie => {
        const [name, value] = cookie.split('=');
        return [name, value];
      }).filter(([name]) => name)
    );

    // Check authentication
    const sessionToken = cookies.session;
    const username = sessionToken ? validateSession(sessionToken) : null;

    // Handle API requests for read permissions
    if (pathname === '/api/permissions/read' && method === 'POST') {
      // Require authentication for permission changes
      if (!username) {
        return new Response('Unauthorized', { status: 401 });
      }

      try {
        // Parse the request body
        const body = await req.json() as { path: string; isPublic: boolean };
        const { path, isPublic } = body;

        if (typeof path !== 'string' || typeof isPublic !== 'boolean') {
          return new Response('Invalid request body', { status: 400 });
        }

        // Construct the full file path
        const filePath = join(ABSOLUTE_ROOT_DIR, path);

        // Check if the path is safe
        if (!isPathSafe(filePath, ABSOLUTE_ROOT_DIR)) {
          return new Response('Access denied: Path is outside the root directory', { status: 403 });
        }

        // Check if the file or directory exists
        try {
          // Use fs.stat to check if the path exists (works for both files and directories)
          await Bun.file(filePath).stat(); // Just check if it throws, we don't need the stats

          // Path exists, continue with permission change
        } catch (error) {
          // If stat fails, the path doesn't exist
          return new Response('File or directory not found', { status: 404 });
        }

        // Update the file read permissions
        const success = await setPublicReadable(filePath, isPublic);

        if (success) {
          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          return new Response('Failed to update read permissions', { status: 500 });
        }
      } catch (error) {
        console.error('Error updating permissions:', error);
        return new Response('Internal server error', { status: 500 });
      }
    }

    // Handle API requests for write permissions
    if (pathname === '/api/permissions/write' && method === 'POST') {
      // Require authentication for permission changes
      if (!username) {
        return new Response('Unauthorized', { status: 401 });
      }

      try {
        // Parse the request body
        const body = await req.json() as { path: string; isWritable: boolean };
        const { path, isWritable } = body;

        if (typeof path !== 'string' || typeof isWritable !== 'boolean') {
          return new Response('Invalid request body', { status: 400 });
        }

        // Construct the full file path
        const filePath = join(ABSOLUTE_ROOT_DIR, path);

        // Check if the path is safe
        if (!isPathSafe(filePath, ABSOLUTE_ROOT_DIR)) {
          return new Response('Access denied: Path is outside the root directory', { status: 403 });
        }

        // Check if the file or directory exists
        try {
          // Use fs.stat to check if the path exists (works for both files and directories)
          await Bun.file(filePath).stat(); // Just check if it throws, we don't need the stats

          // Path exists, continue with permission change
        } catch (error) {
          // If stat fails, the path doesn't exist
          return new Response('File or directory not found', { status: 404 });
        }

        // Update the file write permissions
        const success = await setPublicWritable(filePath, isWritable);

        if (success) {
          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          return new Response('Failed to update write permissions', { status: 500 });
        }
      } catch (error) {
        console.error('Error updating write permissions:', error);
        return new Response('Internal server error', { status: 500 });
      }
    }

    // Handle static files (no auth required)
    if (pathname.startsWith('/public/')) {
      const publicPath = join(import.meta.dir, '..', pathname);
      const file = Bun.file(publicPath);
      if (await file.exists()) {
        return new Response(file);
      }
    }

    // Handle login
    if (pathname === '/login' || pathname.startsWith('/login?')) {
      // Parse the redirect URL from query parameters if present
      const redirectParam = url.searchParams.get('redirect') || '/';

      // If already logged in, redirect to the requested URL or home
      if (username) {
        return new Response(null, {
          status: 302,
          headers: {
            'Location': redirectParam,
          },
        });
      }

      if (method === 'GET') {
        // Show login form with redirect URL if present
        const html = renderLoginPage(undefined, redirectParam !== '/' ? redirectParam : undefined);
        return new Response(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        });
      } else if (method === 'POST') {
        // Handle login form submission
        // Parse the form data manually
        const formText = await req.text();
        const formData: Record<string, string> = {};
        formText.split('&').forEach(pair => {
          const [key, value] = pair.split('=');
          if (key) {
            formData[decodeURIComponent(key)] = decodeURIComponent(value || '');
          }
        });
        const formUsername = formData['username'] || '';
        const password = formData['password'] || '';

        if (validateCredentials(formUsername, password)) {
          // Create session and set cookie
          const token = createSession(formUsername);

          // Get the redirect URL from query parameters or default to home
          const redirectParam = url.searchParams.get('redirect') || '/';

          return new Response(null, {
            status: 302,
            headers: {
              'Location': redirectParam,
              'Set-Cookie': `session=${token}; HttpOnly; Path=/; Max-Age=86400`,
            },
          });
        } else {
          // Show login form with error and preserve the redirect URL
          const html = renderLoginPage('Invalid username or password', redirectParam !== '/' ? redirectParam : undefined);
          return new Response(html, {
            status: 401,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
            },
          });
        }
      }
    }

    // Handle logout
    if (pathname === '/logout') {
      if (sessionToken) {
        deleteSession(sessionToken);
      }
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/login',
          'Set-Cookie': 'session=; HttpOnly; Path=/; Max-Age=0',
        },
      });
    }

    // For all other routes, check if authentication is required
    // Normalize the path to prevent directory traversal attacks
    const relativePath = pathname === '/' ? '' : pathname.substring(1);
    const targetPath = join(ABSOLUTE_ROOT_DIR, relativePath);

    // Check if the path is safe (within the root directory)
    if (!isPathSafe(targetPath, ABSOLUTE_ROOT_DIR)) {
      return new Response('Access denied: Path is outside the root directory', { status: 403 });
    }

    try {
      const fileObj = Bun.file(targetPath);
      const stats = await fileObj.stat();

      // If it's a file (not a directory)
      if (!stats.isDirectory()) {
        // Check if the file is publicly readable
        const isPublic = await isPubliclyReadable(targetPath);

        // If it's public or the user is authenticated, serve the file
        if (isPublic || username) {
          return new Response(fileObj);
        } else {
          // For non-public files without authentication, redirect to login
          // Save the requested URL as a redirect parameter
          const redirectUrl = encodeURIComponent(pathname);
          return new Response(null, {
            status: 302,
            headers: {
              'Location': `/login?redirect=${redirectUrl}`,
            },
          });
        }
      }

      // For directories, check if they are publicly readable
      if (stats.isDirectory()) {
        const isPublic = await isPubliclyReadable(targetPath);

        // If it's public or the user is authenticated, show directory listing
        if (isPublic || username) {
          const entries = await readDirectory(targetPath);
          const html = renderDirectoryListing(pathname, entries, relativePath, username || undefined);
          return new Response(html, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
            },
          });
        } else {
          // For non-public directories without authentication, redirect to login
          // Save the requested URL as a redirect parameter
          const redirectUrl = encodeURIComponent(pathname);
          return new Response(null, {
            status: 302,
            headers: {
              'Location': `/login?redirect=${redirectUrl}`,
            },
          });
        }
      }
    } catch (error) {
      // If there's an error checking the file, default to requiring authentication
      if (!username) {
        // Save the requested URL as a redirect parameter
        const redirectUrl = encodeURIComponent(pathname);
        return new Response(null, {
          status: 302,
          headers: {
            'Location': `/login?redirect=${redirectUrl}`,
          },
        });
      }
    }

    // This code should not be reached for normal operation
    // as we've already handled both files and directories above
    try {
      // If we somehow get here, check if the path exists and serve it
      try {
        const fileObj = Bun.file(targetPath);
        if (await fileObj.exists()) {
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
