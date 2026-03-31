import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { Seo } from '../components/Seo';

afterEach(() => {
  cleanup();
  // Clean up meta tags added by Seo component
  document.head.querySelectorAll('meta[name], meta[property]').forEach((el) => el.remove());
  document.head.querySelectorAll('link[rel="canonical"]').forEach((el) => el.remove());
  document.head.querySelectorAll('#seo-json-ld').forEach((el) => el.remove());
});

describe('Seo component', () => {
  it('sets document title', () => {
    render(<Seo title="Test Page" description="A test description" />);
    expect(document.title).toBe('Test Page');
  });

  it('sets meta description', () => {
    render(<Seo title="Test" description="My page description" />);
    const meta = document.head.querySelector('meta[name="description"]') as HTMLMetaElement;
    expect(meta).toBeTruthy();
    expect(meta.content).toBe('My page description');
  });

  it('sets robots meta tag', () => {
    render(<Seo title="Test" description="Desc" robots="noindex, nofollow" />);
    const meta = document.head.querySelector('meta[name="robots"]') as HTMLMetaElement;
    expect(meta).toBeTruthy();
    expect(meta.content).toContain('noindex');
  });

  it('sets googlebot meta tag', () => {
    render(<Seo title="Test" description="Desc" robots="index, follow" />);
    const meta = document.head.querySelector('meta[name="googlebot"]') as HTMLMetaElement;
    expect(meta).toBeTruthy();
    expect(meta.content).toBe('index, follow');
  });

  it('sets Open Graph meta tags', () => {
    render(<Seo title="OG Test" description="OG Desc" ogType="product" />);
    const ogTitle = document.head.querySelector('meta[property="og:title"]') as HTMLMetaElement;
    const ogDesc = document.head.querySelector('meta[property="og:description"]') as HTMLMetaElement;
    const ogType = document.head.querySelector('meta[property="og:type"]') as HTMLMetaElement;
    expect(ogTitle?.content).toBe('OG Test');
    expect(ogDesc?.content).toBe('OG Desc');
    expect(ogType?.content).toBe('product');
  });

  it('sets Twitter card meta tags', () => {
    render(<Seo title="Twitter Test" description="Twitter Desc" />);
    const card = document.head.querySelector('meta[name="twitter:card"]') as HTMLMetaElement;
    const title = document.head.querySelector('meta[name="twitter:title"]') as HTMLMetaElement;
    expect(card?.content).toBe('summary_large_image');
    expect(title?.content).toBe('Twitter Test');
  });

  it('creates canonical link element', () => {
    render(<Seo title="Test" description="Desc" canonicalPath="/about" />);
    const canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    expect(canonical).toBeTruthy();
    expect(canonical.href).toContain('/about');
  });

  it('injects JSON-LD structured data script', () => {
    const jsonLd = { '@type': 'WebSite', name: 'Forestry Equipment Sales' };
    render(<Seo title="Test" description="Desc" jsonLd={jsonLd} />);
    const script = document.head.querySelector('#seo-json-ld') as HTMLScriptElement;
    expect(script).toBeTruthy();
    expect(script.type).toBe('application/ld+json');
    const parsed = JSON.parse(script.text);
    expect(parsed['@type']).toBe('WebSite');
    expect(parsed.name).toBe('Forestry Equipment Sales');
  });

  it('cleans up JSON-LD script on unmount', () => {
    const { unmount } = render(
      <Seo title="Test" description="Desc" jsonLd={{ '@type': 'Product' }} />
    );
    expect(document.head.querySelector('#seo-json-ld')).toBeTruthy();
    unmount();
    expect(document.head.querySelector('#seo-json-ld')).toBeNull();
  });

  it('sets og:site_name to Forestry Equipment Sales', () => {
    render(<Seo title="Test" description="Desc" />);
    const siteName = document.head.querySelector('meta[property="og:site_name"]') as HTMLMetaElement;
    expect(siteName?.content).toBe('Forestry Equipment Sales');
  });

  it('defaults ogType to website', () => {
    render(<Seo title="Test" description="Desc" />);
    const ogType = document.head.querySelector('meta[property="og:type"]') as HTMLMetaElement;
    expect(ogType?.content).toBe('website');
  });

  it('sets og:image with default logo path', () => {
    render(<Seo title="Test" description="Desc" />);
    const ogImage = document.head.querySelector('meta[property="og:image"]') as HTMLMetaElement;
    expect(ogImage?.content).toContain('Forestry_Equipment_Sales_Logo');
  });

  it('sets og:image with custom imagePath', () => {
    render(<Seo title="Test" description="Desc" imagePath="https://example.com/photo.jpg" />);
    const ogImage = document.head.querySelector('meta[property="og:image"]') as HTMLMetaElement;
    expect(ogImage?.content).toBe('https://example.com/photo.jpg');
  });
});
