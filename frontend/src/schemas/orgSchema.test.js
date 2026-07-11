import { describe, it, expect } from 'vitest';
import { orgSchema } from './orgSchema';

describe('orgSchema', () => {
  it('rejects an empty name', () => {
    const result = orgSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid name', () => {
    const result = orgSchema.safeParse({ name: 'Mi Empresa' });
    expect(result.success).toBe(true);
  });
});
