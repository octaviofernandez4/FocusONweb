import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from './authSchema';

describe('loginSchema', () => {
  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: '' });
    expect(result.success).toBe(false);
  });

  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: 'secret' });
    expect(result.success).toBe(true);
  });
});

describe('registerSchema', () => {
  it('rejects a password shorter than 6 characters', () => {
    const result = registerSchema.safeParse({
      name: 'Octavio',
      lastname: 'Fernandez',
      email: 'a@b.com',
      password: '123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing name', () => {
    const result = registerSchema.safeParse({
      name: '',
      lastname: 'Fernandez',
      email: 'a@b.com',
      password: '123456',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid registration payload', () => {
    const result = registerSchema.safeParse({
      name: 'Octavio',
      lastname: 'Fernandez',
      email: 'a@b.com',
      password: '123456',
    });
    expect(result.success).toBe(true);
  });
});
