import { formatFileSize } from './fileUtils';
import type { FileEntry } from './fileUtils';
import { join } from 'path';

/**
 * Generate breadcrumb navigation HTML
 * @param path Current path
 * @returns HTML string for breadcrumb navigation
 */
function generateBreadcrumbs(path: string): string {
  const parts = path.split('/').filter(Boolean);
  let breadcrumbs = '<div class="breadcrumbs"><a href="/">Home</a>';

  let currentPath = '';
  for (const part of parts) {
    currentPath += `/${part}`;
    breadcrumbs += ` / <a href="${currentPath}/">${part}</a>`;
  }

  return breadcrumbs + '</div>';
}

/**
 * Get appropriate icon for file type
 * @param entry File entry
 * @returns Icon class name
 */
function getFileIcon(entry: FileEntry): string {
  if (entry.isDirectory) return 'folder';

  const ext = entry.name.split('.').pop()?.toLowerCase() || '';

  // Map file extensions to icon classes
  const iconMap: Record<string, string> = {
    // Images
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'svg': 'image',
    // Documents
    'pdf': 'pdf',
    'doc': 'document',
    'docx': 'document',
    'txt': 'text',
    'md': 'markdown',
    // Code
    'html': 'code',
    'css': 'code',
    'js': 'code',
    'ts': 'code',
    'json': 'code',
    // Archives
    'zip': 'archive',
    'rar': 'archive',
    'tar': 'archive',
    'gz': 'archive',
  };

  return iconMap[ext] || 'file';
}

/**
 * Render login page as HTML
 * @param errorMessage Optional error message to display
 * @param redirectUrl Optional URL to redirect to after login
 * @returns HTML string
 */
export function renderLoginPage(errorMessage?: string, redirectUrl?: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login - Directory Browser</title>
      <link rel="icon" href="/public/favicon.ico" type="image/x-icon">
      <link rel="stylesheet" href="/public/css/style.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
      <script>
        // Apply theme immediately to prevent flash
        (function() {
          const savedTheme = localStorage.getItem('theme');
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

          if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
          }
        })();
      </script>
    </head>
    <body>
      <div class="container login-container">
        <div class="header-container">
          <h1>Directory Browser</h1>
          <div class="header-actions">
            <button id="theme-toggle" class="theme-toggle" aria-label="Toggle dark/light mode">
              <i class="fas fa-moon" id="theme-icon"></i>
            </button>
          </div>
        </div>

        <div class="login-form">
          <h2>Login</h2>
          ${errorMessage ? `<div class="error-message">${errorMessage}</div>` : ''}
          <form action="/login${redirectUrl ? `?redirect=${redirectUrl}` : ''}" method="post">
            <div class="form-group">
              <label for="username">Username</label>
              <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required>
            </div>
            <button type="submit" class="login-button">
              <i class="fas fa-sign-in-alt"></i> Login
            </button>
          </form>
        </div>
      </div>

      <script src="/public/js/main.js"></script>
    </body>
    </html>
  `;
}

/**
 * Render directory listing as HTML
 * @param currentPath Current path
 * @param entries Directory entries
 * @param relativePath Relative path from root
 * @param username Currently logged in username
 * @returns HTML string
 */
export function renderDirectoryListing(
  currentPath: string,
  entries: FileEntry[],
  relativePath: string,
  username?: string
): string {
  // Add parent directory entry if not at root
  const displayEntries = [...entries];
  if (currentPath !== '/') {
    displayEntries.unshift({
      name: '..',
      path: join(relativePath, '..'),
      isDirectory: true,
      size: 0,
      mtime: new Date(),
      type: 'directory',
    });
  }

  // Generate table rows for each entry
  const rows = displayEntries.map(entry => {
    const icon = getFileIcon(entry);
    const link = entry.isDirectory
      ? `${currentPath === '/' ? '' : currentPath}${entry.name}/`
      : `${currentPath === '/' ? '' : currentPath}${entry.name}`;

    // Show permission checkboxes for both files and directories, but not for parent directory
    const permissionCheckboxes = (entry.name !== '..')
      ? `<td class="permission">
          <div class="permission-container">
            <!-- Read permission toggle (blue) -->
            <div class="permission-item">
              <label class="toggle-container" title="${entry.isPublic ?
                (entry.isDirectory ? 'Directory is publicly readable' : 'File is publicly readable') :
                (entry.isDirectory ? 'Directory requires login to read' : 'File requires login to read')}">
                <input type="checkbox" class="permission-toggle permission-toggle-read" data-path="${relativePath}${entry.name}${entry.isDirectory ? '/' : ''}" ${entry.isPublic ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <!-- Write permission toggle (red) -->
            <div class="permission-item">
              <label class="toggle-container" title="${entry.isWritable ?
                (entry.isDirectory ? 'Directory is publicly writable' : 'File is publicly writable') :
                (entry.isDirectory ? 'Directory requires login to write' : 'File requires login to write')}">
                <input type="checkbox" class="permission-toggle permission-toggle-write" data-path="${relativePath}${entry.name}${entry.isDirectory ? '/' : ''}" ${entry.isWritable ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </td>`
      : `<td class="permission"></td>`;

    return `
      <tr>
        <td class="icon"><span class="icon-${icon}"></span></td>
        <td class="name"><a href="${link}">${entry.name}</a></td>
        <td class="size">${entry.isDirectory ? '-' : formatFileSize(entry.size)}</td>
        <td class="date">${entry.mtime.toLocaleString()}</td>
        ${username ? permissionCheckboxes : ''}
      </tr>
    `;
  }).join('');

  // Generate the full HTML page
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Directory: ${currentPath}</title>
      <link rel="icon" href="/public/favicon.ico" type="image/x-icon">
      <link rel="stylesheet" href="/public/css/style.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
      <script>
        // Apply theme immediately to prevent flash
        (function() {
          const savedTheme = localStorage.getItem('theme');
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

          if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
          }
        })();
      </script>
    </head>
    <body>
      <div class="container">
        <div class="header-container">
          <h1>Directory Browser</h1>
          <div class="header-actions">
            <button id="theme-toggle" class="theme-toggle" aria-label="Toggle dark/light mode">
              <i class="fas fa-moon" id="theme-icon"></i>
            </button>
            ${username ? `<a href="/logout" class="logout-button" title="Logout ${username}"><i class="fas fa-sign-out-alt"></i></a>` : `<a href="/login?redirect=${encodeURIComponent(currentPath)}" class="login-button" title="Login"><i class="fas fa-sign-in-alt"></i></a>`}
          </div>
        </div>
        ${generateBreadcrumbs(currentPath)}

        <div class="directory-listing">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Size</th>
                <th>Modified</th>
                ${username ? '<th title="permissions"><i class="fas fa-lock-open"></i></th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>

      <script src="/public/js/main.js"></script>

      ${username ? `
      <script>
        // Add event listeners for permission toggles
        document.addEventListener('DOMContentLoaded', () => {
          // Read permission toggles
          const readToggles = document.querySelectorAll('.permission-toggle-read');
          readToggles.forEach(toggle => {
            toggle.addEventListener('change', async (e) => {
              const checkbox = e.target;
              const filePath = checkbox.dataset.path;
              const isPublic = checkbox.checked;

              try {
                const response = await fetch('/api/permissions/read', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ path: filePath, isPublic })
                });

                if (!response.ok) {
                  // If the request failed, revert the checkbox state
                  checkbox.checked = !isPublic;
                  alert('Failed to update read permissions. Please try again.');
                }
              } catch (error) {
                // If there was an error, revert the checkbox state
                checkbox.checked = !isPublic;
                alert('An error occurred while updating read permissions.');
              }
            });
          });

          // Write permission toggles
          const writeToggles = document.querySelectorAll('.permission-toggle-write');
          writeToggles.forEach(toggle => {
            toggle.addEventListener('change', async (e) => {
              const checkbox = e.target;
              const filePath = checkbox.dataset.path;
              const isWritable = checkbox.checked;

              try {
                const response = await fetch('/api/permissions/write', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ path: filePath, isWritable })
                });

                if (!response.ok) {
                  // If the request failed, revert the checkbox state
                  checkbox.checked = !isWritable;
                  alert('Failed to update write permissions. Please try again.');
                }
              } catch (error) {
                // If there was an error, revert the checkbox state
                checkbox.checked = !isWritable;
                alert('An error occurred while updating write permissions.');
              }
            });
          });
        });
      </script>
      ` : ''}
    </body>
    </html>
  `;
}
