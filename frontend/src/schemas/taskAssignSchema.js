import { z } from 'zod';

export const taskAssignSchema = z.object({
  assignedToEmail: z.string().email('Ingresá un email válido del equipo'),
  title: z.string().min(1, 'El título es obligatorio').max(200, 'El título no puede superar los 200 caracteres'),
  description: z.string().max(5000, 'La descripción no puede superar los 5000 caracteres').optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().optional(),
  project: z.string().optional(),
});
