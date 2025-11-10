import { z } from "zod";

export const OfficeSchema = z.object({
  id: z.number().int().nonnegative(),
  name: z.string().min(1),
  state: z.string().min(2).max(2),
  address: z.string().optional(),
  phone: z.string().optional(),
  practiceModel: z.enum(["PO","PLLC"]),
  managingDentist: z.string().optional(),
  dfo: z.string().optional(),
  standardizationStatus: z.enum(["Training Plan","Graduated"]),
  laborModel: z.number(),
});

export type Office = z.infer<typeof OfficeSchema>;

