/** Formats an ISO date string to Thai locale (e.g. "10 มีนาคม 2569"). */
export const formatDate = (d: string): string =>
  new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

/** Formats a number with Thai locale separators. */
export const formatNum = (n: number): string => n.toLocaleString('th-TH');

/** Formats byte size into a human-readable string (B / KB / MB). */
export const formatSize = (bytes: number): string => {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** Resolves a relative upload path to a full URL, or returns the path as-is if already absolute. */
export const getImageUrl = (path?: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}${path}`;
};
