import { Link } from 'react-router-dom';
import { ArrowRight, Home, Search } from 'lucide-react';
import { Seo } from '../components/Seo';

export function NotFound() {
  return (
    <>
      <Seo
        title="Page Not Found | Forestry Equipment Sales"
        description="The page you requested could not be found. Search live equipment inventory, categories, dealers, or return to the Forestry Equipment Sales homepage."
        canonicalPath="/404"
        robots="noindex, nofollow, noarchive, nosnippet, noimageindex"
      />

      <div className="bg-bg min-h-[70vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 w-full">
          <div className="grid w-full gap-12 lg:grid-cols-[1.1fr_420px] lg:items-start">
            <div>
              <span className="label-micro text-accent mb-4 block">404 Error</span>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter leading-none text-ink mb-6">
                PAGE NOT<br />
                <span className="text-muted">FOUND</span>
              </h1>
              <p className="text-sm sm:text-base text-muted leading-relaxed max-w-xl mb-10">
                The page you requested is unavailable or may have moved. Return to live inventory,
                explore category hubs, or start from the marketplace home page.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to="/" className="btn-industrial btn-accent inline-flex items-center gap-2">
                  <Home size={16} /> Home
                </Link>
                <Link to="/search" className="btn-industrial inline-flex items-center gap-2">
                  <Search size={16} /> Search Inventory
                </Link>
                <Link to="/categories" className="btn-industrial inline-flex items-center gap-2">
                  Categories <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="bg-surface border border-line rounded-sm p-8">
              <span className="label-micro text-accent mb-6 block">Helpful Links</span>
              <div className="space-y-4">
                <Link to="/forestry-equipment-for-sale" className="block border border-line bg-bg px-5 py-4 rounded-sm hover:border-accent transition-colors">
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-accent block mb-1">Market Hub</span>
                  <span className="text-base font-black uppercase tracking-tighter text-ink">Forestry Equipment For Sale</span>
                </Link>
                <Link to="/dealers" className="block border border-line bg-bg px-5 py-4 rounded-sm hover:border-accent transition-colors">
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-accent block mb-1">Dealer Directory</span>
                  <span className="text-base font-black uppercase tracking-tighter text-ink">Find Approved Dealers</span>
                </Link>
                <Link to="/contact" className="block border border-line bg-bg px-5 py-4 rounded-sm hover:border-accent transition-colors">
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-accent block mb-1">Support</span>
                  <span className="text-base font-black uppercase tracking-tighter text-ink">Contact Forestry Equipment Sales</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
