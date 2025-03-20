export async function wasInstagramHandleTaken(handle: string) {
  const response = await fetch(`https://www.instagram.com/${handle}`);
  const html = await response.text();

  if (html.includes(`{"username":"${handle}"}`)) {
    return true;
  }

  return false;
}

export const INSTAGRAM_PAGES = [
  "feed",
  "reel",
  "search",
  "messages",
  "notifications",
];
