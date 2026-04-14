export interface BrandAssetUrls {
  brandLogo: string;
  footerIcon: string;
  appleTouchIcon: string;
  faviconSvg: string;
  favicon32: string;
  favicon16: string;
  faviconIco: string;
  androidChrome192: string;
  androidChrome512: string;
  manifest: string;
}

const PUBLIC_ASSET_VERSION = '20260407a';
const versionedAsset = (path: string) => `${path}?v=${PUBLIC_ASSET_VERSION}`;

const DEFAULT_BRAND_ASSET_URLS: BrandAssetUrls = {
  brandLogo: versionedAsset('/Forestry_Equipment_Sales_Light_Mode_Logo.svg'),
  footerIcon: versionedAsset('/Forestry_Equipment_Sales_Light_Mode_Logo.svg'),
  appleTouchIcon: versionedAsset('/apple-touch-icon.png'),
  faviconSvg: versionedAsset('/Forestry_Equipment_Sales_Favicon.svg'),
  favicon32: versionedAsset('/favicon-32x32.png'),
  favicon16: versionedAsset('/favicon-16x16.png'),
  faviconIco: versionedAsset('/favicon.ico'),
  androidChrome192: versionedAsset('/android-chrome-192x192.png'),
  androidChrome512: versionedAsset('/android-chrome-512x512.png'),
  manifest: versionedAsset('/site.webmanifest'),
};

export async function getCurrentBrandAssetUrls(): Promise<BrandAssetUrls> {
  return DEFAULT_BRAND_ASSET_URLS;
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
  updateHeadLink('link[rel="icon"][type="image/svg+xml"]', assets.faviconSvg);
  updateHeadLink('link[rel="icon"][type="image/png"][sizes="32x32"]', assets.favicon32);
  updateHeadLink('link[rel="icon"][type="image/png"][sizes="16x16"]', assets.favicon16);
  updateHeadLink('link[rel="icon"]:not([sizes]):not([type])', assets.faviconIco);
  updateHeadLink('link[rel="shortcut icon"]', assets.faviconIco);
  updateHeadLink('link[rel="manifest"]', assets.manifest);
}

