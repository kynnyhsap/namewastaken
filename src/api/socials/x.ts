export async function wasXHandleTaken(handle: string) {
  const response = await fetch(`https://x.com/${handle}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
  });

  const html = await response.text();

  if (html.includes("This account doesn’t exist")) {
    return false;
  }

  return true;
}
