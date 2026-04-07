import { Link } from 'react-router-dom';
import { ArrowRight, Home, Search, ShieldAlert } from 'lucide-react';
import { Seo } from '../components/Seo';

export function NotFound() {
  return (
    <>
      <Seo
        title="Page Not Found | Forestry Equipment Sales"
        description="The page you requested could not be found. Browse live equipment inventory, categories, dealers, or return to the Forestry Equipment Sales homepage."
        canonicalPath="/404"
        robots="noindex, nofollow, noarchive, nosnippet, noimageindex"
      />

      <section className="mx-auto flex min-h-[70vh] w-full max-w-[1600px] items-center px-4 py-16 md:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,420px)] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-line bg-surface/80 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-muted shadow-sm">
              <ShieldAlert className="h-4 w-4 text-accent" />
              Route Not Available
            </div>

            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-accent">
                404 Error
              </p>
              <h1 className="max-w-4xl text-5xl font-black uppercase tracking-[-0.04em] text-ink sm:text-6xl">
                Page Not Found
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted">
                The page you requested is unavailable or may have moved. Return to live inventory,
                browse category hubs, or start from the marketplace home page.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-sm bg-accent px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:opacity-90"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Link>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 rounded-sm border border-line bg-surface px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-ink transition hover:border-accent hover:text-accent"
              >
                <Search className="h-4 w-4" />
                Browse Inventory
              </Link>
              <Link
                to="/categories"
                className="inline-flex items-center gap-2 rounded-sm border border-line bg-surface px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-ink transition hover:border-accent hover:text-accent"
              >
                Explore Categories
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-sm border border-line bg-surface p-8 shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-muted">
              Helpful Links
            </p>
            <div className="mt-6 space-y-4">
              <Link
                to="/forestry-equipment-for-sale"
                className="block rounded-sm border border-line bg-bg px-5 py-4 transition hover:border-accent"
              >
                <p className="text-xs font-black uppercase tracking-[0.24em] text-accent">
                  Market Hub
                </p>
                <p className="mt-2 text-lg font-black uppercase tracking-[-0.03em] text-ink">
                  Forestry Equipment For Sale
                </p>
              </Link>
              <Link
                to="/dealers"
                className="block rounded-sm border border-line bg-bg px-5 py-4 transition hover:border-accent"
              >
                <p className="text-xs font-black uppercase tracking-[0.24em] text-accent">
                  Dealer Directory
                </p>
                <p className="mt-2 text-lg font-black uppercase tracking-[-0.03em] text-ink">
                  Find Approved Dealers
                </p>
              </Link>
              <Link
                to="/contact"
                className="block rounded-sm border border-line bg-bg px-5 py-4 transition hover:border-accent"
              >
                <p className="text-xs font-black uppercase tracking-[0.24em] text-accent">
                  Support
                </p>
                <p className="mt-2 text-lg font-black uppercase tracking-[-0.03em] text-ink">
                  Contact Forestry Equipment Sales
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
