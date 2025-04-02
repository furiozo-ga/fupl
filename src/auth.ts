/**
 * Authentication module for the directory browser
 */

// Hardcoded user credentials
const USERS = {
  'a': {
    password: 'a',
    name: 'Admin User'
  }
};

/**
 * Validate user credentials
 * @param username Username
 * @param password Password
 * @returns Boolean indicating if credentials are valid
 */
export function validateCredentials(username: string, password: string): boolean {
  const user = USERS[username];
  if (!user) return false;
  return user.password === password;
}

/**
 * Generate a simple session token
 * @returns Session token
 */
export function generateSessionToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// In-memory session storage
// In a production app, this would be a database or Redis
const sessions: Record<string, { username: string, expires: Date }> = {};

/**
 * Create a new session
 * @param username Username
 * @returns Session token
 */
export function createSession(username: string): string {
  const token = generateSessionToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // 24-hour session
  
  sessions[token] = {
    username,
    expires
  };
  
  return token;
}

/**
 * Validate a session token
 * @param token Session token
 * @returns Username if valid, null otherwise
 */
export function validateSession(token: string): string | null {
  const session = sessions[token];
  if (!session) return null;
  
  // Check if session has expired
  if (new Date() > session.expires) {
    delete sessions[token];
    return null;
  }
  
  return session.username;
}

/**
 * Delete a session
 * @param token Session token
 */
export function deleteSession(token: string): void {
  delete sessions[token];
}
