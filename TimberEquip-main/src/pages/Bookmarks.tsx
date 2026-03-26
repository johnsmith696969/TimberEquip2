import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, LogIn, Package, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../components/AuthContext';
import { ListingCard } from '../components/ListingCard';
import { Seo } from '../components/Seo';
import { equipmentService } from '../services/equipmentService';
import { Listing } from '../types';

export function Bookmarks() {
  const { user, isAuthenticated, toggleFavorite } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user?.favorites?.length) {
        setListings([]);
        setLoading(false);
        return;
      }
      try {
        const saved = await equipmentService.getListingsByIds(user.favorites);
        setListings(saved);
      } catch (err) {
        console.error('Failed to fetch bookmarks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, [user?.favorites]);

  const handleRemove = async (listingId: string) => {
    setRemoving(listingId);
    try {
      await toggleFavorite(listingId);
      setListings((prev) => prev.filter((l) => l.id !== listingId));
    } finally {
      setRemoving(null);
    }
  };

  return (
    <>
      <Seo
        title="Saved Equipment | Forestry Equipment Sales"
        description="Your bookmarked forestry equipment listings on Forestry Equipment Sales."
        canonicalPath="/bookmarks"
      />

      {/* Page Header */}
      <section className="bg-surface border-b border-line py-16 px-4 md:px-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-10 h-10 bg-accent flex items-center justify-center rounded-sm">
              <Bookmark className="text-white" size={20} />
            </div>
            <span className="label-micro text-accent">My Saved Equipment</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
            Bookmarked <br />
            <span className="text-muted">Equipment</span>
          </h1>
          {isAuthenticated && listings.length > 0 && (
            <p className="mt-4 text-sm text-muted font-medium">
              {listings.length} saved listing{listings.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4 md:px-8 bg-bg">
        <div className="max-w-[1600px] mx-auto">

          {/* Not logged in */}
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="w-20 h-20 bg-surface border border-line flex items-center justify-center rounded-sm mb-8">
                <LogIn className="text-muted" size={36} />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-3">Sign in to view bookmarks</h2>
              <p className="text-muted font-medium text-sm max-w-md mb-8">
                Create a free account or sign in to save equipment listings and access them from any device.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/login" className="btn-industrial btn-accent py-4 px-8">
                  Sign In
                  <ArrowRight className="ml-2" size={16} />
                </Link>
                <Link to="/register" className="btn-industrial py-4 px-8">
                  Create Account
                </Link>
              </div>
            </motion.div>
          )}

          {/* Loading */}
          {isAuthenticated && loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-surface border border-line animate-pulse aspect-[4/5] rounded-sm" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {isAuthenticated && !loading && listings.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="w-20 h-20 bg-surface border border-line flex items-center justify-center rounded-sm mb-8">
                <Package className="text-muted" size={36} />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-3">No saved equipment yet</h2>
              <p className="text-muted font-medium text-sm max-w-md mb-8">
                Browse inventory and click the bookmark icon on any listing to save it here for quick access.
              </p>
              <Link to="/search" className="btn-industrial btn-accent py-4 px-8">
                Browse Inventory
                <ArrowRight className="ml-2" size={16} />
              </Link>
            </motion.div>
          )}

          {/* Listings grid */}
          {isAuthenticated && !loading && listings.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {listings.map((listing) => (
                  <motion.div
                    key={listing.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    {/* Remove button */}
                    <button
                      onClick={() => handleRemove(listing.id)}
                      disabled={removing === listing.id}
                      aria-label="Remove bookmark"
                      className="absolute top-2 left-2 z-10 p-2 bg-red-500/90 text-white rounded-sm hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {removing === listing.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                    <ListingCard
                      listing={listing}
                      isFavorite={true}
                      onToggleFavorite={handleRemove}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
