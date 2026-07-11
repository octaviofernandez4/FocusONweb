import { describe, it, expect } from 'vitest';
import { projectSchema } from './projectSchema';

describe('projectSchema', () => {
  it('rejects an empty name', () => {
    const result = projectSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a color outside the preset palette', () => {
    const result = projectSchema.safeParse({ name: 'Diseño', color: 'not-a-real-color' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid name and color', () => {
    const result = projectSchema.safeParse({ name: 'Diseño', color: 'pink' });
    expect(result.success).toBe(true);
  });

  it('defaults color to indigo when omitted', () => {
    const result = projectSchema.safeParse({ name: 'Diseño' });
    expect(result.success).toBe(true);
    expect(result.data.color).toBe('indigo');
  });
});
