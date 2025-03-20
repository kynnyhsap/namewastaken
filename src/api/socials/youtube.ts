export async function wasYoutubeHandleTaken(handle: string) {
  handle = handle.toLowerCase();

  if (YOUTUBE_PAGES.includes(handle)) {
    return true;
  }

  const response = await fetch(`https://www.youtube.com/${handle}`);

  return response.status !== 404;
}

export const YOUTUBE_PAGES = [
  "feed",
  "playlist",
  "subscriptions",
  //   ...
];
