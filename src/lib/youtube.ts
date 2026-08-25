/**
 * Extract YouTube Video ID from any standard YouTube URL or ID string
 * Supports:
 * - https://www.youtube.com/watch?v=abc123xyz
 * - https://youtu.be/abc123xyz
 * - https://www.youtube.com/embed/abc123xyz
 * - abc123xyz
 */
export function extractYouTubeVideoId(input: string): string {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();

  // If already an ID (alphanumeric, dashes, underscores, length 11)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Matches watch?v=, youtu.be/, or /embed/
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);

  if (match && match[2].length === 11) {
    return match[2];
  }

  return trimmed;
}

/**
 * Generate YouTube Embed URL from video ID
 */
export function getYouTubeEmbedUrl(videoIdOrUrl: string, autoPlay = false): string {
  const videoId = extractYouTubeVideoId(videoIdOrUrl);
  if (!videoId) return '';
  return `https://www.youtube.com/embed/${videoId}?autoplay=${autoPlay ? 1 : 0}&rel=0&modestbranding=1`;
}

/**
 * Generate YouTube Thumbnail URL
 */
export function getYouTubeThumbnailUrl(videoIdOrUrl: string, quality: 'default' | 'hqdefault' | 'maxresdefault' = 'maxresdefault'): string {
  const videoId = extractYouTubeVideoId(videoIdOrUrl);
  if (!videoId) return '';
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}
