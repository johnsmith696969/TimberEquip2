import { describe, expect, it } from 'vitest';
import { EQUIPMENT_TAXONOMY } from '../constants/equipmentData';
import { getSchemaForListing } from '../constants/categorySpecs';

describe('logging equipment taxonomy', () => {
  it('includes Processors / Harvesters under Logging Equipment', () => {
    expect(EQUIPMENT_TAXONOMY['Logging Equipment']).toHaveProperty('Processors / Harvesters');
    expect(EQUIPMENT_TAXONOMY['Logging Equipment']['Processors / Harvesters']).toContain('TIGERCAT');
  });

  it('resolves a schema for Processors / Harvesters listings', () => {
    const schema = getSchemaForListing('Logging Equipment', 'Processors / Harvesters');

    expect(schema.displayName).toBe('Processors / Harvesters');
    expect(schema.specs.length).toBeGreaterThan(0);
  });
});
