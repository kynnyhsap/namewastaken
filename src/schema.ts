import { z } from "zod";

export const HandleSchema = z
  .string()
  .min(1, "Username is required")
  .max(30, "Username is too long (max 30 characters)")
  .regex(/^[a-zA-Z0-9._]+$/, "Username can only contain letters, numbers, dots and underscores")
  .transform((val) => val.toLowerCase());

export type Handle = z.infer<typeof HandleSchema>;

export function parseHandle(input: string): Handle {
  return HandleSchema.parse(input);
}

export function safeParseHandle(input: string) {
  return HandleSchema.safeParse(input);
}
