import { z } from 'zod';

export const taskAssignSchema = z.object({
  assignedToEmail: z.string().email('Ingresá un email válido del equipo'),
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().optional(),
  project: z.string().optional(),
});
