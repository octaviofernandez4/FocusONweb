import { z } from 'zod';
import { PROJECT_COLOR_KEYS } from '../utils/projectColors';

export const projectSchema = z.object({
  name: z.string().min(1, 'El nombre del proyecto es obligatorio ❌'),
  color: z.enum(PROJECT_COLOR_KEYS).default('indigo'),
});
