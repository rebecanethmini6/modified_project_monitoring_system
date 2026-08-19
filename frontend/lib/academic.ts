const ACADEMIC_YEAR_START_MONTH = 7;

function registrationYear(registrationDate: string): number {
  const match = /^(\d{4})-\d{2}-\d{2}$/.exec(registrationDate);
  if (!match) throw new Error('Registration date must use YYYY-MM-DD format.');
  return Number(match[1]);
}

export function normalizeRegistrationDate(value: unknown): string {
  const date = String(value ?? '').trim();
  if (/^\d{4}$/.test(date)) return `${date}-08-01`;
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '';
}

export function getAcademicBatch(registrationDate: string): string {
  const startYear = registrationYear(registrationDate) - 2;
  return `${startYear}/${startYear + 1}`;
}

export function getCurrentAcademicYear(now: Date = new Date()): string {
  const startYear = now.getMonth() >= ACADEMIC_YEAR_START_MONTH ? now.getFullYear() : now.getFullYear() - 1;
  return `${startYear}/${startYear + 1}`;
}

export function getCurrentStudyYear(registrationDate: string, now: Date = new Date()): string {
  const yearsSinceRegistration = now.getFullYear() - registrationYear(registrationDate);

  // University progression rule: 2023 -> Third Year and 2024 -> Second Year
  // in calendar year 2026. Newly registered students remain First Year.
  const studyYear = Math.max(1, yearsSinceRegistration);
  if (studyYear > 4) return 'Graduate';
  return ['First Year', 'Second Year', 'Third Year', 'Fourth Year'][studyYear - 1];
}
