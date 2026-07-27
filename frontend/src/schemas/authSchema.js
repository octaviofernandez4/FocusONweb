import { z } from 'zod';

// Reglas para el Login
export const loginSchema = z.object({
  email: z.string().email("El email no es válido ❌"),
  password: z.string().min(1, "La contraseña es obligatoria ❌")
});

// Reglas para el Registro
export const registerSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio ❌"),
  lastname: z.string().min(1, "El apellido es obligatorio ❌"),
  email: z.string().email("El email no es válido ❌"),
  password: z.string().min(6, "La contraseña debe tener mínimo 6 caracteres ❌"),
  companyName: z.string().optional()
});