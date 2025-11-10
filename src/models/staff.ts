import { z } from "zod";

export const StaffSchema = z.object({
  officeId: z.number().int().nonnegative(),
  name: z.string().min(1),
  title: z.enum(["Lab Manager","Full Tech","Waxer Finisher","Processor"]),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  phone: z.string().optional(),
});

export type Staff = z.infer<typeof StaffSchema>;

