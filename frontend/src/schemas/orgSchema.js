import { z } from 'zod';

export const orgSchema = z.object({
  name: z.string().min(1, 'El nombre de la organización es obligatorio ❌'),
  industry: z.string().optional(),
  address: z.string().optional(),
});
