import { wasYoutubeHandleTaken } from "./socials/youtube";
import { wasInstagramHandleTaken } from "./socials/instagram";
import { handleSchema } from "./validators";

export async function checkHandle(handle: string) {
  // Remove @ if present and trim whitespace
  handle = handle.replace(/^@+/, "").trim();

  // Validate the handle
  const result = handleSchema.safeParse(handle);

  if (!result.success) {
    return {
      success: false,
      error: result.error.errors[0].message,
    };
  }

  const validatedHandle = result.data;

  const [youtube, instagram] = await Promise.all([
    wasYoutubeHandleTaken(validatedHandle),
    wasInstagramHandleTaken(validatedHandle),
  ]);

  return {
    success: true,
    data: {
      handle: validatedHandle,
      results: {
        youtube,
        instagram,
      },
    },
  };
}
