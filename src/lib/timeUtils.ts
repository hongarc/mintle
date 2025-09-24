/**
 * Generate UTC-based hour ID in YYYYMMDDHH format
 * @param now - Date object (defaults to current time)
 * @returns Hour ID string like "2025092323"
 */
export function hourIdUtc(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hour = String(now.getUTCHours()).padStart(2, '0');
  
  return `${year}${month}${day}${hour}`;
}

/**
 * Calculate milliseconds until the next hour
 * @param now - Date object (defaults to current time)
 * @returns Milliseconds until next hour
 */
export function millisecondsToNextHour(now: Date = new Date()): number {
  const nextHour = new Date(now);
  nextHour.setUTCHours(now.getUTCHours() + 1, 0, 0, 0);
  return nextHour.getTime() - now.getTime();
}

/**
 * Format time remaining as MM:SS
 * @param milliseconds - Time remaining in milliseconds
 * @returns Formatted time string
 */
export function formatTimeRemaining(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Check if two dates are in the same UTC hour
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are in same UTC hour
 */
export function isSameUtcHour(date1: Date, date2: Date): boolean {
  return hourIdUtc(date1) === hourIdUtc(date2);
}