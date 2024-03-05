import { z } from "zod";

export const messageSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  text: z.string(),
  timestamp: z.number(),
});

export const messageSchemaArray = z.array(messageSchema);

export type Message = z.infer<typeof messageSchema>;