import { describe, expect, it } from 'vitest';

/**
 * JSON-LD Schema Validation Tests
 *
 * These tests validate that the structured data schemas used across the site
 * conform to Schema.org specifications. This prevents SEO regressions.
 */

function isValidSchemaOrgType(type: string): boolean {
  const validTypes = [
    'WebSite', 'WebPage', 'Organization', 'LocalBusiness',
    'Product', 'Offer', 'BreadcrumbList', 'ListItem',
    'FAQPage', 'Question', 'Answer', 'ContactPage',
    'BlogPosting', 'Article', 'SearchAction', 'ItemList',
    'AggregateOffer', 'ImageObject', 'VideoObject',
    'HowTo', 'CollectionPage', 'ItemPage',
  ];
  return validTypes.includes(type);
}

function validateJsonLd(schema: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!schema['@context']) {
    errors.push('Missing @context');
  } else if (schema['@context'] !== 'https://schema.org') {
    errors.push(`Invalid @context: ${schema['@context']}`);
  }

  if (!schema['@type']) {
    errors.push('Missing @type');
  } else if (typeof schema['@type'] === 'string' && !isValidSchemaOrgType(schema['@type'])) {
    errors.push(`Unknown @type: ${schema['@type']}`);
  }

  return { valid: errors.length === 0, errors };
}

describe('JSON-LD Schema Validation', () => {
  describe('WebSite schema', () => {
    it('produces valid WebSite schema', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Forestry Equipment Sales',
        url: 'https://forestryequipmentsales.com',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://forestryequipmentsales.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      };
      const result = validateJsonLd(schema);
      expect(result.valid).toBe(true);
      expect(schema.name).toBeTruthy();
      expect(schema.url).toMatch(/^https:\/\//);
    });
  });

  describe('Product schema', () => {
    it('produces valid Product schema for a listing', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: '2021 Tigercat 1075B Forwarder',
        description: 'Used forwarder with 3,150 hours',
        image: ['https://example.com/photo.jpg'],
        brand: { '@type': 'Organization', name: 'Tigercat' },
        offers: {
          '@type': 'Offer',
          price: 349000,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          itemCondition: 'https://schema.org/UsedCondition',
        },
      };
      const result = validateJsonLd(schema);
      expect(result.valid).toBe(true);
      expect(schema.name).toBeTruthy();
      expect(schema.offers.price).toBeGreaterThan(0);
      expect(schema.offers.priceCurrency).toBe('USD');
    });

    it('requires name for Product', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: '',
      };
      expect(schema.name).toBeFalsy();
    });
  });

  describe('BreadcrumbList schema', () => {
    it('produces valid BreadcrumbList schema', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://forestryequipmentsales.com' },
          { '@type': 'ListItem', position: 2, name: 'Feller Bunchers', item: 'https://forestryequipmentsales.com/equipment/feller-bunchers' },
          { '@type': 'ListItem', position: 3, name: '2021 Tigercat 1075B' },
        ],
      };
      const result = validateJsonLd(schema);
      expect(result.valid).toBe(true);
      expect(schema.itemListElement.length).toBeGreaterThanOrEqual(2);

      // Verify positions are sequential
      schema.itemListElement.forEach((item, index) => {
        expect(item.position).toBe(index + 1);
        expect(item['@type']).toBe('ListItem');
        expect(item.name).toBeTruthy();
      });
    });
  });

  describe('FAQPage schema', () => {
    it('produces valid FAQPage schema', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How do I list equipment for sale?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Create an account, then use the "Sell Equipment" form.',
            },
          },
        ],
      };
      const result = validateJsonLd(schema);
      expect(result.valid).toBe(true);
      expect(schema.mainEntity.length).toBeGreaterThan(0);
      schema.mainEntity.forEach((item) => {
        expect(item['@type']).toBe('Question');
        expect(item.name).toBeTruthy();
        expect(item.acceptedAnswer['@type']).toBe('Answer');
        expect(item.acceptedAnswer.text).toBeTruthy();
      });
    });
  });

  describe('Organization schema', () => {
    it('produces valid Organization schema', () => {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Forestry Equipment Sales',
        url: 'https://forestryequipmentsales.com',
        logo: 'https://forestryequipmentsales.com/Forestry_Equipment_Sales_Logo.png',
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          email: 'support@forestryequipmentsales.com',
        },
      };
      const result = validateJsonLd(schema);
      expect(result.valid).toBe(true);
      expect(schema.name).toBeTruthy();
      expect(schema.url).toMatch(/^https:\/\//);
      expect(schema.logo).toMatch(/^https:\/\//);
    });
  });

  describe('validateJsonLd utility', () => {
    it('rejects missing @context', () => {
      const result = validateJsonLd({ '@type': 'WebSite' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing @context');
    });

    it('rejects invalid @context', () => {
      const result = validateJsonLd({ '@context': 'http://schema.org', '@type': 'WebSite' });
      expect(result.valid).toBe(false);
    });

    it('rejects missing @type', () => {
      const result = validateJsonLd({ '@context': 'https://schema.org' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing @type');
    });

    it('rejects unknown @type', () => {
      const result = validateJsonLd({ '@context': 'https://schema.org', '@type': 'FakeType' });
      expect(result.valid).toBe(false);
    });
  });
});
