const IMG = 'https://image.tmdb.org/t/p';
export const tmdbImage = (path: string | null, size: string) =>
  path ? `${IMG}/${size}${path}` : null;
