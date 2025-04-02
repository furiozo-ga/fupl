import { join, normalize } from 'path';
import { readdir, stat, access, constants, chmod } from 'fs/promises';

// File entry interface
export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  mtime: Date;
  type: string;
  isPublic?: boolean;
  isWritable?: boolean;
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

    // Process each entry
    const entryPromises = entries.map(async (name) => {
      const path = join(dirPath, name);
      const stats = await stat(path);

      const isDir = stats.isDirectory();
      // Check public permissions for both files and directories
      const isPublic = await isPubliclyReadable(path);
      const isWritable = await isPubliclyWritable(path);

      return {
        name,
        path: path,
        isDirectory: isDir,
        size: stats.size,
        mtime: stats.mtime,
        type: isDir ? 'directory' : getMimeType(name),
        isPublic: isPublic,
        isWritable: isWritable,
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

/**
 * Check if a file or directory is publicly readable
 * @param filePath Path to the file or directory
 * @returns Promise<boolean> True if the file or directory is publicly readable
 */
export async function isPubliclyReadable(filePath: string): Promise<boolean> {
  try {
    // Check if the file is readable by others (public)
    // We use the access function with the constants.R_OK flag
    // This checks if the file is readable by the current process
    // In a production environment, you would want to check the actual file permissions
    // using something like fs.stat and checking the mode bits
    await access(filePath, constants.R_OK);

    // For a more accurate check in a real-world scenario, you could do:
    const fileStats = await stat(filePath);
    const mode = fileStats.mode;

    // Check if the file is readable by others (last digit has read permission)
    // 0o4 is the read permission bit for "others"
    const isPublic = (mode & 0o4) === 0o4;

    return isPublic;
  } catch (error) {
    // If there's an error accessing the file, it's not publicly readable
    return false;
  }
}

/**
 * Check if a file or directory is publicly writable
 * @param filePath Path to the file or directory
 * @returns Promise<boolean> True if the file or directory is publicly writable
 */
export async function isPubliclyWritable(filePath: string): Promise<boolean> {
  try {
    // Check if the file is writable by others (public)
    // We use the access function with the constants.W_OK flag
    await access(filePath, constants.W_OK);

    // For a more accurate check in a real-world scenario:
    const fileStats = await stat(filePath);
    const mode = fileStats.mode;

    // Check if the file is writable by others (last digit has write permission)
    // 0o2 is the write permission bit for "others"
    const isWritable = (mode & 0o2) === 0o2;

    return isWritable;
  } catch (error) {
    // If there's an error accessing the file, it's not publicly writable
    return false;
  }
}

/**
 * Set or remove public readable permission for a file
 * @param filePath Path to the file
 * @param isPublic Whether the file should be publicly readable
 * @returns Promise<boolean> True if the operation was successful
 */
export async function setPublicReadable(filePath: string, isPublic: boolean): Promise<boolean> {
  try {
    // Get current file stats to get the current mode
    const fileStats = await stat(filePath);
    let mode = fileStats.mode;

    if (isPublic) {
      // Add read permission for others (0o4)
      // We preserve all other permissions and just add the read bit for others
      mode |= 0o4;
    } else {
      // Remove read permission for others
      // We preserve all other permissions and just remove the read bit for others
      mode &= ~0o4;
    }

    // Apply the new permissions
    await chmod(filePath, mode);
    return true;
  } catch (error) {
    console.error('Error changing file permissions:', error);
    return false;
  }
}

/**
 * Set or remove public writable permission for a file
 * @param filePath Path to the file
 * @param isWritable Whether the file should be publicly writable
 * @returns Promise<boolean> True if the operation was successful
 */
export async function setPublicWritable(filePath: string, isWritable: boolean): Promise<boolean> {
  try {
    // Get current file stats to get the current mode
    const fileStats = await stat(filePath);
    let mode = fileStats.mode;

    if (isWritable) {
      // Add write permission for others (0o2)
      // We preserve all other permissions and just add the write bit for others
      mode |= 0o2;
    } else {
      // Remove write permission for others
      // We preserve all other permissions and just remove the write bit for others
      mode &= ~0o2;
    }

    // Apply the new permissions
    await chmod(filePath, mode);
    return true;
  } catch (error) {
    console.error('Error changing file write permissions:', error);
    return false;
  }
}
