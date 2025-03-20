export async function wasYoutubeHandleTaken(handle: string) {
  const response = await fetch(`https://www.youtube.com/${handle}`);

  return response.status !== 404;
}

export const YOUTUBE_PAGES = [
  "feed",
  "playlist",
  "subscriptions",
  //   ...
];
