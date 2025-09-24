import { describe, it, expect } from 'vitest';
import { hourIdUtc, millisecondsToNextHour, formatTimeRemaining, isSameUtcHour } from '../timeUtils';

describe('timeUtils', () => {
  describe('hourIdUtc', () => {
    it('should generate correct hour ID for a given date', () => {
      const testDate = new Date('2025-09-23T23:45:30.123Z');
      const result = hourIdUtc(testDate);
      expect(result).toBe('2025092323');
    });

    it('should pad single digit months, days, and hours with zeros', () => {
      const testDate = new Date('2025-01-05T09:30:00Z');
      const result = hourIdUtc(testDate);
      expect(result).toBe('2025010509');
    });

    it('should handle year boundaries correctly', () => {
      const testDate = new Date('2024-12-31T23:59:59Z');
      const result = hourIdUtc(testDate);
      expect(result).toBe('2024123123');
    });

    it('should handle leap year February correctly', () => {
      const testDate = new Date('2024-02-29T12:00:00Z');
      const result = hourIdUtc(testDate);
      expect(result).toBe('2024022912');
    });
  });

  describe('millisecondsToNextHour', () => {
    it('should calculate correct milliseconds to next hour', () => {
      const testDate = new Date('2025-09-23T23:45:30.123Z');
      const result = millisecondsToNextHour(testDate);
      const expected = (14 * 60 + 29) * 1000 + 877; // 14 min 29.877 sec
      expect(result).toBe(expected);
    });

    it('should return close to 3600000ms when at start of hour', () => {
      const testDate = new Date('2025-09-23T23:00:00.001Z');
      const result = millisecondsToNextHour(testDate);
      expect(result).toBe(3599999);
    });

    it('should handle hour boundary correctly', () => {
      const testDate = new Date('2025-09-23T23:59:59.999Z');
      const result = millisecondsToNextHour(testDate);
      expect(result).toBe(1);
    });
  });

  describe('formatTimeRemaining', () => {
    it('should format time correctly for various durations', () => {
      expect(formatTimeRemaining(0)).toBe('00:00');
      expect(formatTimeRemaining(1000)).toBe('00:01');
      expect(formatTimeRemaining(60000)).toBe('01:00');
      expect(formatTimeRemaining(3661000)).toBe('61:01');
      expect(formatTimeRemaining(125000)).toBe('02:05');
    });

    it('should handle edge cases', () => {
      expect(formatTimeRemaining(999)).toBe('00:00');
      expect(formatTimeRemaining(59999)).toBe('00:59');
      expect(formatTimeRemaining(3599999)).toBe('59:59');
    });
  });

  describe('isSameUtcHour', () => {
    it('should return true for dates in same UTC hour', () => {
      const date1 = new Date('2025-09-23T23:15:30Z');
      const date2 = new Date('2025-09-23T23:45:10Z');
      expect(isSameUtcHour(date1, date2)).toBe(true);
    });

    it('should return false for dates in different UTC hours', () => {
      const date1 = new Date('2025-09-23T23:59:59Z');
      const date2 = new Date('2025-09-24T00:00:01Z');
      expect(isSameUtcHour(date1, date2)).toBe(false);
    });

    it('should handle timezone differences correctly', () => {
      const date1 = new Date('2025-09-23T23:30:00Z');
      const date2 = new Date('2025-09-24T01:30:00+02:00'); // Same UTC time
      expect(isSameUtcHour(date1, date2)).toBe(true);
    });
  });
});