export const RATING_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1);

export function formatRatingLabel(rating: string | number | null | undefined): string {
  if (rating === null || rating === undefined || rating === '') {
    return '';
  }

  const parsed = parseInt(String(rating), 10);
  if (Number.isNaN(parsed)) {
    return String(rating);
  }

  return `${parsed}/10`;
}

export function hasNumericRating(rating: string | number | null | undefined): boolean {
  const parsed = parseInt(String(rating), 10);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 10;
}

export function ratingBadgeClass(rating: string | number | null | undefined): string {
  const base = 'font-semibold rounded-full text-[10px] border';
  const parsed = parseInt(String(rating), 10);

  if (Number.isNaN(parsed)) {
    return `${base} bg-slate-50 text-gray-600 border-slate-100`;
  }
  if (parsed >= 8) {
    return `${base} bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100`;
  }
  if (parsed >= 5) {
    return `${base} bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100`;
  }
  return `${base} bg-red-50 text-red-700 hover:bg-red-50 border-red-100`;
}
