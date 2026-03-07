export const formatDate = (d: string): string =>
  new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

export const formatNum = (n: number): string => n.toLocaleString('th-TH');

export const formatSize = (bytes: number): string => {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getImageUrl = (path?: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}${path}`;
};
