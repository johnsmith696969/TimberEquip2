import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeContext';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Home } from './pages/Home';
import { ScrollToTop } from './components/ScrollToTop';
import { LocaleProvider } from './components/LocaleContext';

import { AuthProvider } from './components/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MotionConfig } from 'framer-motion';
import { useAuth } from './components/AuthContext';
import { getDefaultAccountWorkspacePath } from './utils/sellerAccess';
import { isOperatorOnlyRole } from './utils/roleScopes';

const Search = lazy(() => import('./pages/Search').then((module) => ({ default: module.Search })));
const ListingDetail = lazy(() => import('./pages/ListingDetail').then((module) => ({ default: module.ListingDetail })));
const SellerProfile = lazy(() => import('./pages/SellerProfile').then((module) => ({ default: module.SellerProfile })));
const Blog = lazy(() => import('./pages/Blog').then((module) => ({ default: module.Blog })));
const BlogPostDetail = lazy(() => import('./pages/BlogPostDetail').then((module) => ({ default: module.BlogPostDetail })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const Compare = lazy(() => import('./pages/Compare').then((module) => ({ default: module.Compare })));
const Categories = lazy(() => import('./pages/Categories').then((module) => ({ default: module.Categories })));
const ForestryHubPage = lazy(() => import('./pages/SeoLandingPages').then((module) => ({ default: module.ForestryHubPage })));
const LoggingHubPage = lazy(() => import('./pages/SeoLandingPages').then((module) => ({ default: module.LoggingHubPage })));
const CategoryLandingPage = lazy(() => import('./pages/SeoLandingPages').then((module) => ({ default: module.CategoryLandingPage })));
const CategorySearchPage = lazy(() => import('./pages/CategorySearchPage').then((module) => ({ default: module.CategorySearchPage })));
const ManufacturerLandingPage = lazy(() => import('./pages/SeoLandingPages').then((module) => ({ default: module.ManufacturerLandingPage })));
const ManufacturerModelLandingPage = lazy(() => import('./pages/SeoLandingPages').then((module) => ({ default: module.ManufacturerModelLandingPage })));
const ManufacturerModelCategoryLandingPage = lazy(() => import('./pages/SeoLandingPages').then((module) => ({ default: module.ManufacturerModelCategoryLandingPage })));
const StateMarketLandingPage = lazy(() => import('./pages/SeoLandingPages').then((module) => ({ default: module.StateMarketLandingPage })));
const StateCategoryLandingPage = lazy(() => import('./pages/SeoLandingPages').then((module) => ({ default: module.StateCategoryLandingPage })));
const ManufacturerCategoryLandingPage = lazy(() => import('./pages/SeoLandingPages').then((module) => ({ default: module.ManufacturerCategoryLandingPage })));
const Dealers = lazy(() => import('./pages/Dealers').then((module) => ({ default: module.Dealers })));
const Login = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const Register = lazy(() => import('./pages/Register').then((module) => ({ default: module.Register })));
const Sell = lazy(() => import('./pages/Sell').then((module) => ({ default: module.Sell })));
const DealerOS = lazy(() => import('./pages/DealerOS').then((module) => ({ default: module.DealerOS })));
const Financing = lazy(() => import('./pages/Financing').then((module) => ({ default: module.Financing })));
const Logistics = lazy(() => import('./pages/Logistics').then((module) => ({ default: module.Logistics })));
const Profile = lazy(() => import('./pages/Profile').then((module) => ({ default: module.Profile })));
const About = lazy(() => import('./pages/About').then((module) => ({ default: module.About })));
const Faq = lazy(() => import('./pages/Faq').then((module) => ({ default: module.Faq })));
const OurTeam = lazy(() => import('./pages/OurTeam').then((module) => ({ default: module.OurTeam })));
const Contact = lazy(() => import('./pages/Contact').then((module) => ({ default: module.Contact })));
const AdPrograms = lazy(() => import('./pages/AdPrograms').then((module) => ({ default: module.AdPrograms })));
const SubscriptionSuccess = lazy(() => import('./pages/SubscriptionSuccess').then((module) => ({ default: module.SubscriptionSuccess })));
const Auctions = lazy(() => import('./pages/Auctions').then((module) => ({ default: module.Auctions })));
const Privacy = lazy(() => import('./pages/Privacy').then((module) => ({ default: module.Privacy })));
const Terms = lazy(() => import('./pages/Terms').then((module) => ({ default: module.Terms })));
const Cookies = lazy(() => import('./pages/Cookies').then((module) => ({ default: module.Cookies })));
const Bookmarks = lazy(() => import('./pages/Bookmarks').then((module) => ({ default: module.Bookmarks })));
const Dmca = lazy(() => import('./pages/Dmca').then((module) => ({ default: module.Dmca })));
const Unsubscribe = lazy(() => import('./pages/Unsubscribe').then((module) => ({ default: module.Unsubscribe })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then((module) => ({ default: module.ResetPassword })));
const NotFound = lazy(() => import('./pages/NotFound').then((module) => ({ default: module.NotFound })));

function RouteLoadingFallback() {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-[1600px] items-center justify-center px-4 py-16 md:px-8">
      <div className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--muted, #78716C)' }}>Loading Page...</div>
    </div>
  );
}

function ServerOwnedRoute({
  fallback,
  label = 'public marketplace page',
}: {
  fallback?: React.ReactNode;
  label?: string;
}) {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined' || import.meta.env.DEV) {
      return;
    }

    const currentUrl = new URL(window.location.href);
    const sessionKey = `fes.server-owned-route:${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;

    if (window.sessionStorage.getItem(sessionKey) === '1') {
      return;
    }

    window.sessionStorage.setItem(sessionKey, '1');
    window.location.replace(currentUrl.toString());
  }, [location.key]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const currentUrl = new URL(window.location.href);
    const sessionKey = `fes.server-owned-route:${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
    const timer = window.setTimeout(() => {
      window.sessionStorage.removeItem(sessionKey);
    }, 10000);

    return () => window.clearTimeout(timer);
  }, [location.key]);

  if (import.meta.env.DEV && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="mx-auto flex min-h-[40vh] max-w-[1600px] items-center justify-center px-4 py-16 text-center md:px-8">
      <div>
        <div className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--muted, #78716C)' }}>
          Opening {label}
        </div>
        <p className="mt-3 text-sm" style={{ color: 'var(--muted, #78716C)' }}>
          Handing this route to the server-rendered public page.
        </p>
      </div>
    </div>
  );
}

function RedirectSellerToDealer() {
  const { id } = useParams<{ id: string }>();
  return <Navigate replace to={id ? `/dealers/${id}` : '/dealers'} />;
}

function AccountWorkspaceRedirect() {
  const { user } = useAuth();
  return <Navigate replace to={getDefaultAccountWorkspacePath(user)} />;
}

function SellWorkspaceRoute() {
  const { user } = useAuth();

  if (user && isOperatorOnlyRole(user.role)) {
    return <Navigate replace to="/admin?tab=listings" />;
  }

  return <Sell />;
}

function ProfileWorkspaceRoute() {
  const { user } = useAuth();

  if (user && isOperatorOnlyRole(user.role)) {
    return <Navigate replace to="/admin" />;
  }

  return <Profile />;
}

function App() {
  return (
    <AuthProvider>
      <LocaleProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <MotionConfig reducedMotion="user" transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.25 }}>
            <Router>
              <ScrollToTop />
              <Layout>
                <Suspense fallback={<RouteLoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<ServerOwnedRoute label="home page" fallback={<Home />} />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/equipment/:slug" element={<ListingDetail />} />
                    <Route path="/equipment/:slug/:publicKey" element={<ListingDetail />} />
                    <Route path="/listing/:id" element={<ListingDetail />} />
                    <Route path="/listing/:id/:slug" element={<ListingDetail />} />
                    <Route path="/seller/:id" element={<RedirectSellerToDealer />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:id" element={<BlogPostDetail />} />
                    <Route path="/blog/:id/:slug" element={<BlogPostDetail />} />
                    <Route path="/logging-equipment-for-sale" element={<ServerOwnedRoute label="logging equipment hub" fallback={<LoggingHubPage />} />} />
                    <Route path="/forestry-equipment-for-sale" element={<ServerOwnedRoute label="forestry equipment hub" fallback={<ForestryHubPage />} />} />
                    <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/compare" element={<Compare />} />
                    <Route path="/categories" element={<ServerOwnedRoute label="categories page" fallback={<Categories />} />} />
                    <Route path="/categories/:categorySlug" element={<ServerOwnedRoute label="category page" fallback={<CategorySearchPage />} />} />
                    <Route path="/manufacturers" element={<ServerOwnedRoute label="manufacturers page" />} />
                    <Route path="/manufacturers/:manufacturerSlug/models/:modelSlug/:categorySaleSlug" element={<ServerOwnedRoute label="manufacturer model category page" fallback={<ManufacturerModelCategoryLandingPage />} />} />
                    <Route path="/manufacturers/:manufacturerSlug/models/:modelSlug" element={<ServerOwnedRoute label="manufacturer model page" fallback={<ManufacturerModelLandingPage />} />} />
                    <Route path="/manufacturers/:manufacturerSlug/:categorySaleSlug" element={<ServerOwnedRoute label="manufacturer category page" fallback={<ManufacturerCategoryLandingPage />} />} />
                    <Route path="/manufacturers/:manufacturerSlug" element={<ServerOwnedRoute label="manufacturer page" fallback={<ManufacturerLandingPage />} />} />
                    <Route path="/states" element={<ServerOwnedRoute label="states page" />} />
                    <Route path="/states/:stateSlug/logging-equipment-for-sale" element={<ServerOwnedRoute label="state logging market page" fallback={<StateMarketLandingPage marketKeyOverride="logging" />} />} />
                    <Route path="/states/:stateSlug/forestry-equipment-for-sale" element={<ServerOwnedRoute label="state forestry market page" fallback={<StateMarketLandingPage marketKeyOverride="forestry" />} />} />
                    <Route path="/states/:stateSlug/:categorySaleSlug" element={<ServerOwnedRoute label="state category page" fallback={<StateCategoryLandingPage />} />} />
                    <Route path="/dealers" element={<ServerOwnedRoute label="dealers page" fallback={<Dealers />} />} />
                    <Route path="/dealers/:id/inventory" element={<ServerOwnedRoute label="dealer inventory page" fallback={<SellerProfile />} />} />
                    <Route path="/dealers/:id/:categorySlug" element={<ServerOwnedRoute label="dealer category page" fallback={<SellerProfile />} />} />
                    <Route path="/dealers/:id" element={<ServerOwnedRoute label="dealer page" fallback={<SellerProfile />} />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/sell" element={<ProtectedRoute><SellWorkspaceRoute /></ProtectedRoute>} />
                    <Route path="/dealer-os" element={<ProtectedRoute requireDealerOs><DealerOS /></ProtectedRoute>} />
                    <Route path="/account" element={<ProtectedRoute><AccountWorkspaceRedirect /></ProtectedRoute>} />
                    <Route path="/financing" element={<Financing />} />
                    <Route path="/logistics" element={<Logistics />} />
                    <Route path="/profile" element={<ProtectedRoute><ProfileWorkspaceRoute /></ProtectedRoute>} />
                    <Route path="/about" element={<About />} />
                    <Route path="/about-us" element={<About />} />
                    <Route path="/faq" element={<Faq />} />
                    <Route path="/our-team" element={<OurTeam />} />
                    <Route path="/about/our-team" element={<OurTeam />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/ad-programs" element={<AdPrograms />} />
                    <Route path="/subscription-success" element={<SubscriptionSuccess />} />
                    <Route path="/auctions" element={<Auctions />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/cookies" element={<Cookies />} />
                    <Route path="/dmca" element={<Dmca />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/unsubscribe" element={<Unsubscribe />} />
                    <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
                    <Route path="/404" element={<NotFound />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </Layout>
            </Router>
            </MotionConfig>
          </ErrorBoundary>
        </ThemeProvider>
      </LocaleProvider>
    </AuthProvider>
  );
}

export default App;
