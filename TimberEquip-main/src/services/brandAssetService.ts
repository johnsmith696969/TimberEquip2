import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../firebase';

export interface BrandAssetUrls {
  brandLogo: string;
  footerIcon: string;
  appleTouchIcon: string;
  favicon32: string;
  favicon16: string;
  faviconIco: string;
  androidChrome192: string;
  androidChrome512: string;
  manifest: string;
}

const DEFAULT_BRAND_ASSET_URLS: BrandAssetUrls = {
  brandLogo: '/Forestry_Equipment_Sales_Light_Mode_Logo.svg',
  footerIcon: '/Logo-Transparent.png',
  appleTouchIcon: '/apple-touch-icon.png',
  favicon32: '/favicon-32x32.png',
  favicon16: '/favicon-16x16.png',
  faviconIco: '/favicon.ico',
  androidChrome192: '/android-chrome-192x192.png',
  androidChrome512: '/android-chrome-512x512.png',
  manifest: '/site.webmanifest',
};

const STORAGE_SUBFOLDERS = ['', 'logo', 'favicon', 'icons', 'social'];

async function resolveFromBrandAssets(fileName: string): Promise<string | null> {
  for (const subfolder of STORAGE_SUBFOLDERS) {
    const storagePath = subfolder
      ? `brand-assets/${subfolder}/${fileName}`
      : `brand-assets/${fileName}`;

    try {
      return await getDownloadURL(ref(storage, storagePath));
    } catch {
      // Keep trying fallback paths until one resolves.
    }
  }

  return null;
}

export async function getCurrentBrandAssetUrls(): Promise<BrandAssetUrls> {
  const [
    brandLogo,
    footerIcon,
    appleTouchIcon,
    favicon32,
    favicon16,
    faviconIco,
    androidChrome192,
    androidChrome512,
    manifest,
  ] = await Promise.all([
    resolveFromBrandAssets('Forestry_Equipment_Sales_Light_Mode_Logo.svg'),
    resolveFromBrandAssets('Logo-Transparent.png'),
    resolveFromBrandAssets('apple-touch-icon.png'),
    resolveFromBrandAssets('favicon-32x32.png'),
    resolveFromBrandAssets('favicon-16x16.png'),
    resolveFromBrandAssets('favicon.ico'),
    resolveFromBrandAssets('android-chrome-192x192.png'),
    resolveFromBrandAssets('android-chrome-512x512.png'),
    resolveFromBrandAssets('site.webmanifest'),
  ]);

  return {
    brandLogo: brandLogo ?? DEFAULT_BRAND_ASSET_URLS.brandLogo,
    footerIcon: footerIcon ?? DEFAULT_BRAND_ASSET_URLS.footerIcon,
    appleTouchIcon: appleTouchIcon ?? DEFAULT_BRAND_ASSET_URLS.appleTouchIcon,
    favicon32: favicon32 ?? DEFAULT_BRAND_ASSET_URLS.favicon32,
    favicon16: favicon16 ?? DEFAULT_BRAND_ASSET_URLS.favicon16,
    faviconIco: faviconIco ?? DEFAULT_BRAND_ASSET_URLS.faviconIco,
    androidChrome192: androidChrome192 ?? DEFAULT_BRAND_ASSET_URLS.androidChrome192,
    androidChrome512: androidChrome512 ?? DEFAULT_BRAND_ASSET_URLS.androidChrome512,
    manifest: manifest ?? DEFAULT_BRAND_ASSET_URLS.manifest,
  };
}

function updateHeadLink(selector: string, href: string): void {
  const link = document.querySelector(selector) as HTMLLinkElement | null;
  if (link) {
    link.href = href;
  }
}

export async function applyHeadBrandAssets(): Promise<void> {
  const assets = await getCurrentBrandAssetUrls();

  updateHeadLink('link[rel="apple-touch-icon"][sizes="180x180"]', assets.appleTouchIcon);
  updateHeadLink('link[rel="icon"][type="image/png"][sizes="32x32"]', assets.favicon32);
  updateHeadLink('link[rel="icon"][type="image/png"][sizes="16x16"]', assets.favicon16);
  updateHeadLink('link[rel="icon"]:not([sizes]):not([type])', assets.faviconIco);
  updateHeadLink('link[rel="manifest"]', assets.manifest);
}
