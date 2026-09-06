import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters."),
  description: z.string().min(5, "Description must be at least 5 characters."),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
