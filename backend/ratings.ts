export const MIN_PROJECT_RATING = 1;
export const MAX_PROJECT_RATING = 10;

export function parseProjectRating(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = typeof value === 'number' ? value : parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < MIN_PROJECT_RATING || parsed > MAX_PROJECT_RATING) {
    return null;
  }

  return parsed;
}

export function formatProjectRating(value: number): string {
  return String(value);
}
