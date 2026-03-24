/**
 * Parse a YouTube watch, embed, short, or youtu.be URL to a video id.
 * @param {string} [input]
 * @returns {string|null} 11-character id or null
 */
export function getYoutubeVideoId(input) {
  if (!input || typeof input !== 'string') return null;
  const s = input.trim();
  if (!s) return null;

  let m = s.match(/youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?|#|$)/);
  if (m) return m[1];

  m = s.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];

  m = s.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?|#|$)/);
  if (m) return m[1];

  m = s.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?|#|$)/);
  if (m) return m[1];

  return null;
}

/**
 * Default grid thumbnail for a YouTube video id (hq 480x360, widely available).
 * @param {string} videoId
 */
export function getYoutubeThumbnailUrl(videoId) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * URL for embedding in an iframe (no autoplay; rel=0 limits related at end).
 * @param {string} videoId
 */
export function getYoutubeEmbedUrl(videoId) {
  const q = new URLSearchParams({ rel: '0' });
  return `https://www.youtube.com/embed/${videoId}?${q.toString()}`;
}
