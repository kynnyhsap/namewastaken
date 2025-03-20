export async function wasTiktokHandleTaken(handle: string) {
  const response = await fetch(`https://tiktok.com/@${handle}`);

  const html = await response.text();

  if (html.includes(`"desc":"@${handle}`)) {
    return true;
  }

  return false;
}
