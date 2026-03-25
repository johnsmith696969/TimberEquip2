import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path: string;
}

interface Props {
  items?: BreadcrumbItem[];
}

/**
 * Breadcrumbs component for SEO and navigation
 * Automatically generates schema.org/BreadcrumbList structured data
 */
export function Breadcrumbs({ items = [] }: Props) {
  const location = useLocation();

  // Generate breadcrumbs if not provided
  const defaultBreadcrumbs = getDefaultBreadcrumbs(location.pathname);
  const breadcrumbs = [...(items.length > 0 ? items : defaultBreadcrumbs)];

  // Add home if not already there
  if (breadcrumbs.length === 0 || breadcrumbs[0].path !== '/') {
    breadcrumbs.unshift({ label: 'Home', path: '/' });
  }

  // Schema.org structured data
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbs.map((item, idx) => ({
      '@type': 'ListItem',
      'position': idx + 1,
      'name': item.label,
      'item': `https://timberequip.com${item.path}`
    }))
  };

  if (breadcrumbs.length <= 1) return null;

  return (
    <>
      {/* Structured data */}
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>

      {/* Breadcrumb UI */}
      <nav className="flex items-center gap-2 px-4 md:px-8 py-4 text-[11px] font-bold uppercase tracking-wider text-muted overflow-x-auto">
        {breadcrumbs.map((item, idx) => (
          <React.Fragment key={item.path}>
            {idx > 0 && <ChevronRight size={12} className="flex-shrink-0" />}
            {idx === breadcrumbs.length - 1 ? (
              <span className="flex-shrink-0 text-ink">{item.label}</span>
            ) : (
              <Link
                to={item.path}
                className="flex-shrink-0 text-accent hover:underline transition-colors"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>
    </>
  );
}

function getDefaultBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Parse search params for category/manufacturer context
  const searchParams = new URLSearchParams(window.location.search);
  const category = searchParams.get('category');
  const manufacturer = searchParams.get('manufacturer');
  const subcategory = searchParams.get('subcategory');

  switch (pathname) {
    case '/':
      return [];
    case '/search':
      const crumbs: BreadcrumbItem[] = [{ label: 'Search', path: '/search' }];
      if (category) {
        crumbs.push({ 
          label: category, 
          path: `/search?category=${encodeURIComponent(category)}` 
        });
      }
      if (subcategory && category) {
        crumbs.push({ 
          label: subcategory, 
          path: `/search?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}` 
        });
      }
      if (manufacturer && category) {
        crumbs.push({ 
          label: manufacturer, 
          path: `/search?category=${encodeURIComponent(category)}&manufacturer=${encodeURIComponent(manufacturer)}` 
        });
      }
      return crumbs;
    case '/categories':
      return [{ label: 'Categories', path: '/categories' }];
    case '/sell':
      return [{ label: 'Sell Equipment', path: '/sell' }];
    case '/blog':
      return [{ label: 'Equipment News', path: '/blog' }];
    case '/auctions':
      return [{ label: 'Auctions', path: '/auctions' }];
    case '/financing':
      return [{ label: 'Financing', path: '/financing' }];
    case '/ad-programs':
      return [{ label: 'Ad Programs', path: '/ad-programs' }];
    case '/about':
      return [{ label: 'About', path: '/about' }];
    case '/contact':
      return [{ label: 'Contact', path: '/contact' }];
    default:
      return [];
  }
}
