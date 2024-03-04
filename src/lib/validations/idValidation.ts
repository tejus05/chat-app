import { string, z } from "zod";

export const idSchema = z.object({
  id: z.string()
})