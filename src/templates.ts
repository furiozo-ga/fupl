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
 * Render directory listing as HTML
 * @param currentPath Current path
 * @param entries Directory entries
 * @param relativePath Relative path from root
 * @returns HTML string
 */
export function renderDirectoryListing(
  currentPath: string,
  entries: FileEntry[],
  relativePath: string
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

    return `
      <tr>
        <td class="icon"><span class="icon-${icon}"></span></td>
        <td class="name"><a href="${link}">${entry.name}</a></td>
        <td class="size">${entry.isDirectory ? '-' : formatFileSize(entry.size)}</td>
        <td class="date">${entry.mtime.toLocaleString()}</td>
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
          <button id="theme-toggle" class="theme-toggle" aria-label="Toggle dark/light mode">
            <i class="fas fa-moon" id="theme-icon"></i>
          </button>
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
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>

      <script src="/public/js/main.js"></script>
    </body>
    </html>
  `;
}
