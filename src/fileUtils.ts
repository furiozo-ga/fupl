import { join, relative, resolve, normalize } from 'path';
import { readdir, stat } from 'fs/promises';

// File entry interface
export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  mtime: Date;
  type: string;
}

/**
 * Check if a path is safe (within the root directory)
 * @param targetPath The path to check
 * @param rootDir The root directory
 * @returns boolean indicating if the path is safe
 */
export function isPathSafe(targetPath: string, rootDir: string): boolean {
  const normalizedTarget = normalize(targetPath);
  const normalizedRoot = normalize(rootDir);

  // Check if the normalized target path starts with the normalized root path
  return normalizedTarget.startsWith(normalizedRoot);
}

/**
 * Get the MIME type based on file extension
 * @param filename The filename
 * @returns The MIME type
 */
export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'md': 'text/markdown',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Read directory contents
 * @param dirPath The directory path
 * @returns Array of file entries
 */
export async function readDirectory(dirPath: string): Promise<FileEntry[]> {
  try {
    const entries = await readdir(dirPath);

    // Add parent directory entry if not at root
    const result: FileEntry[] = [];

    // Process each entry
    const entryPromises = entries.map(async (name) => {
      const path = join(dirPath, name);
      const stats = await stat(path);

      const isDir = stats.isDirectory();
      return {
        name,
        path: path,
        isDirectory: isDir,
        size: stats.size,
        mtime: stats.mtime,
        type: isDir ? 'directory' : getMimeType(name),
      };
    });

    const fileEntries = await Promise.all(entryPromises);

    // Sort directories first, then files alphabetically
    return fileEntries.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Error reading directory:', error);
    throw error;
  }
}

/**
 * Format file size to human-readable format
 * @param bytes The file size in bytes
 * @returns Formatted file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}
