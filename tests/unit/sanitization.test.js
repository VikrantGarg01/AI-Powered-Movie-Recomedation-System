import { describe, it, expect } from 'vitest';

describe('Sanitization & ReDoS Prevention Unit Tests', () => {
  const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  it('should escape all regex special characters', () => {
    const specialChars = '.*+?^${}()|[]\\';
    const escaped = escapeRegex(specialChars);
    
    // Each character must be preceded by a backslash
    expect(escaped).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
  });

  it('should neutralize catastrophic backtracking regex strings', () => {
    const evilPayload = '(a+)+$';
    const escaped = escapeRegex(evilPayload);
    expect(escaped).toBe('\\(a\\+\\)\\+\\$');

    // Executing the escaped regex should safely match literal text without exponential explosion
    const safeRegex = new RegExp(escaped, 'i');
    expect(safeRegex.test('(a+)+$')).toBe(true);
    expect(safeRegex.test('aaaaaaaaaaaaaaaaaaaaaaaaaa!')).toBe(false);
  });

  it('should preserve regular alphanumeric query words', () => {
    const normalQuery = 'Christopher Nolan Inception 2010';
    expect(escapeRegex(normalQuery)).toBe(normalQuery);
  });
});
