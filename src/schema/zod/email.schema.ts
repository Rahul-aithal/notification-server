import { z } from "zod";

export const EmailSchema = z.object({
  name: z.string().nonempty(),
  email: z.string().nonempty(),
  message: z.string().nonempty(),
  userId: z.string().nonempty(),
  sentiment:z.enum(["positive","negative"])
});

export type emailType = z.infer<typeof EmailSchema>;
