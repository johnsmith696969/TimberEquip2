import { describe, expect, it } from 'vitest';
import { buildMarketplaceCategoryFamilies } from '../utils/marketplaceCategoryFamilies';

describe('buildMarketplaceCategoryFamilies', () => {
  it('rolls subcategory inventory into the top-level family count', () => {
    const families = buildMarketplaceCategoryFamilies(
      [
        {
          category: 'Logging Equipment',
          activeCount: 2,
          previousWeekCount: 1,
          weeklyChangePercent: 100,
          averagePrice: 120000,
        },
        {
          category: 'Skidders',
          activeCount: 3,
          previousWeekCount: 2,
          weeklyChangePercent: 50,
          averagePrice: 100000,
        },
        {
          category: 'Forwarders',
          activeCount: 5,
          previousWeekCount: 4,
          weeklyChangePercent: 25,
          averagePrice: 200000,
        },
      ],
      {
        'Logging Equipment': {
          Skidders: [],
          Forwarders: [],
        },
        Trucks: {},
      }
    );

    const logging = families.find((entry) => entry.name === 'Logging Equipment');

    expect(logging).toMatchObject({
      activeCount: 10,
      previousWeekCount: 7,
      weeklyChangePercent: 42.9,
      averagePrice: 154000,
      subcategoryCount: 2,
    });
  });
});
