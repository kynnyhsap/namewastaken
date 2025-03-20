import { z } from "zod";

import { wasYoutubeHandleTaken } from "./socials/youtube";
import { wasInstagramHandleTaken } from "./socials/instagram";
import { wasXHandleTaken } from "./socials/x";
import { wasTiktokHandleTaken } from "./socials/tiktok";

export const HandleSchema = z
  .string()
  .min(1, "bestie drop a handle first")
  .max(30, "oof that's too long bestie")
  .regex(
    /^[a-zA-Z0-9._]+$/,
    "only letters, numbers, dots and underscores bestie"
  )
  .transform((val) => val.toLowerCase());

export async function wastaken(handle: string) {
  const h = HandleSchema.parse(handle);

  const [youtube, instagram, x, tiktok] = await Promise.all([
    wasYoutubeHandleTaken(h),
    wasInstagramHandleTaken(h),
    wasXHandleTaken(h),
    wasTiktokHandleTaken(h),
  ]);

  return {
    // x,
    youtube,
    instagram,
    tiktok,
  };
}
