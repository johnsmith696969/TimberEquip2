import { useEffect } from 'react';

interface SeoProps {
  title: string;
  description: string;
  canonicalPath?: string;
  robots?: string;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  ogType?: 'website' | 'article' | 'product';
  imagePath?: string;
  preloadImage?: string;
}

const BASE_URL = 'https://timberequip.com';
const DEFAULT_ROBOTS =
  import.meta.env.VITE_ALLOW_INDEXING === 'true'
    ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    : 'noindex, nofollow, noarchive, nosnippet, noimageindex';

function setMetaTag(selector: { name?: string; property?: string }, content: string) {
  const attr = selector.name ? 'name' : 'property';
  const value = selector.name ?? selector.property;
  if (!value) return;

  let tag = document.head.querySelector(`meta[${attr}="${value}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, value);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

export function Seo({
  title,
  description,
  canonicalPath,
  robots = DEFAULT_ROBOTS,
  jsonLd,
  ogType = 'website',
  imagePath = '/TimberEquip-OG-Share.png?v=20260405d',
  preloadImage,
}: SeoProps) {
  useEffect(() => {
    document.title = title;

    const canonicalHref = canonicalPath ? `${BASE_URL}${canonicalPath}` : BASE_URL;
    const imageUrl = imagePath.startsWith('http') ? imagePath : `${BASE_URL}${imagePath}`;

    setMetaTag({ name: 'description' }, description);
    setMetaTag({ name: 'robots' }, robots);
    setMetaTag({ name: 'googlebot' }, robots);
    setMetaTag({ property: 'og:title' }, title);
    setMetaTag({ property: 'og:description' }, description);
    setMetaTag({ property: 'og:type' }, ogType);
    setMetaTag({ property: 'og:url' }, canonicalHref);
    setMetaTag({ property: 'og:site_name' }, 'TimberEquip');
    setMetaTag({ property: 'og:image' }, imageUrl);
    setMetaTag({ name: 'twitter:card' }, 'summary_large_image');
    setMetaTag({ name: 'twitter:title' }, title);
    setMetaTag({ name: 'twitter:description' }, description);
    setMetaTag({ name: 'twitter:image' }, imageUrl);

    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalHref);

    // Preload LCP hero image
    const existingPreload = document.head.querySelector('#seo-preload-hero') as HTMLLinkElement | null;
    if (preloadImage) {
      const preloadLink = existingPreload || document.createElement('link');
      preloadLink.id = 'seo-preload-hero';
      preloadLink.rel = 'preload';
      preloadLink.as = 'image';
      preloadLink.href = preloadImage;
      if (!existingPreload) document.head.appendChild(preloadLink);
    } else if (existingPreload) {
      existingPreload.remove();
    }

    const existingScript = document.head.querySelector('#seo-json-ld');
    if (existingScript) {
      existingScript.remove();
    }

    if (jsonLd) {
      const script = document.createElement('script');
      script.id = 'seo-json-ld';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      const currentScript = document.head.querySelector('#seo-json-ld');
      if (currentScript) {
        currentScript.remove();
      }
      const currentPreload = document.head.querySelector('#seo-preload-hero');
      if (currentPreload) {
        currentPreload.remove();
      }
    };
  }, [title, description, canonicalPath, robots, jsonLd, ogType, imagePath, preloadImage]);

  return null;
}

