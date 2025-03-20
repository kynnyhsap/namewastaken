import { z } from "zod";

export const handleSchema = z
  .string()
  .min(1, "bestie drop a handle first")
  .max(30, "oof that's too long bestie")
  .regex(/^[a-zA-Z0-9._]+$/, "only letters, numbers, dots and underscores bestie")
  .transform((val) => val.toLowerCase());

export type HandleValidationError = z.ZodError<typeof handleSchema>; 