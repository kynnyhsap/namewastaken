export async function wasInstagramHandleTaken(handle: string) {
  const response = await fetch(`https://www.instagram.com/${handle}`);
  const html = await response.text();

  const rewriter = new HTMLRewriter();
  let title = "";

  rewriter.on("title", {
    text(text) {
      title += text.text;
    },
  });

  await rewriter.transform(new Response(html)).text();

  return title !== "Page not found • Instagram";
}

export const INSTAGRAM_PAGES = [
  "feed",
  "reel",
  "search",
  "messages",
  "notifications",
];
