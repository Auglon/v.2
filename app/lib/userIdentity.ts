/**
 * Simple user identity management using browser fingerprinting
 */

export function getUserId(): string {
  if (typeof window === 'undefined') return '';
  
  // Check if we already have a user ID stored
  let userId = localStorage.getItem('keros_user_id');
  
  if (!userId) {
    // Generate a new user ID based on timestamp and random values
    userId = `USR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('keros_user_id', userId);
    localStorage.setItem('keros_first_seen', new Date().toISOString());
  }
  
  return userId;
}

export function getUserMetadata() {
  if (typeof window === 'undefined') return null;
  
  return {
    userId: getUserId(),
    firstSeen: localStorage.getItem('keros_first_seen'),
    lastSeen: new Date().toISOString(),
    sessionCount: parseInt(localStorage.getItem('keros_session_count') || '0'),
  };
}

export function incrementSessionCount() {
  if (typeof window === 'undefined') return;
  
  const count = parseInt(localStorage.getItem('keros_session_count') || '0');
  localStorage.setItem('keros_session_count', (count + 1).toString());
  localStorage.setItem('keros_last_seen', new Date().toISOString());
}