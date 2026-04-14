import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useParams } from 'react-router-dom';
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

const Search = lazy(() => import('./pages/Search').then((m) => ({ default: m.Search })));
const ListingDetail = lazy(() => import('./pages/ListingDetail').then((m) => ({ default: m.ListingDetail })));
const Blog = lazy(() => import('./pages/Blog').then((m) => ({ default: m.Blog })));
const BlogPostDetail = lazy(() => import('./pages/BlogPostDetail').then((m) => ({ default: m.BlogPostDetail })));
const Dealers = lazy(() => import('./pages/Dealers').then((m) => ({ default: m.Dealers })));
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })));
const Sell = lazy(() => import('./pages/Sell').then((m) => ({ default: m.Sell })));
const Financing = lazy(() => import('./pages/Financing').then((m) => ({ default: m.Financing })));
const Logistics = lazy(() => import('./pages/Logistics').then((m) => ({ default: m.Logistics })));
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })));
const Faq = lazy(() => import('./pages/Faq').then((m) => ({ default: m.Faq })));
const OurTeam = lazy(() => import('./pages/OurTeam').then((m) => ({ default: m.OurTeam })));
const Contact = lazy(() => import('./pages/Contact').then((m) => ({ default: m.Contact })));
const AdPrograms = lazy(() => import('./pages/AdPrograms').then((m) => ({ default: m.AdPrograms })));
const Auctions = lazy(() => import('./pages/Auctions').then((m) => ({ default: m.Auctions })));
const Unsubscribe = lazy(() => import('./pages/Unsubscribe').then((m) => ({ default: m.Unsubscribe })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then((m) => ({ default: m.ResetPassword })));
const SellerProfile = lazy(() => import('./pages/SellerProfile').then((module) => ({ default: module.SellerProfile })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const Compare = lazy(() => import('./pages/Compare').then((module) => ({ default: module.Compare })));
const Categories = lazy(() => import('./pages/Categories').then((module) => ({ default: module.Categories })));
const Manufacturers = lazy(() => import('./pages/Manufacturers').then((module) => ({ default: module.Manufacturers })));
const States = lazy(() => import('./pages/States').then((module) => ({ default: module.States })));
const seoLandingImport = () => import('./pages/SeoLandingPages');
const ForestryHubPage = lazy(() => seoLandingImport().then((m) => ({ default: m.ForestryHubPage })));
const LoggingHubPage = lazy(() => seoLandingImport().then((m) => ({ default: m.LoggingHubPage })));
const CategoryLandingPage = lazy(() => seoLandingImport().then((m) => ({ default: m.CategoryLandingPage })));
const CategorySearchPage = lazy(() => import('./pages/CategorySearchPage').then((module) => ({ default: module.CategorySearchPage })));
const ManufacturerLandingPage = lazy(() => seoLandingImport().then((m) => ({ default: m.ManufacturerLandingPage })));
const ManufacturerModelLandingPage = lazy(() => seoLandingImport().then((m) => ({ default: m.ManufacturerModelLandingPage })));
const ManufacturerModelCategoryLandingPage = lazy(() => seoLandingImport().then((m) => ({ default: m.ManufacturerModelCategoryLandingPage })));
const StateMarketLandingPage = lazy(() => seoLandingImport().then((m) => ({ default: m.StateMarketLandingPage })));
const StateCategoryLandingPage = lazy(() => seoLandingImport().then((m) => ({ default: m.StateCategoryLandingPage })));
const ManufacturerCategoryLandingPage = lazy(() => seoLandingImport().then((m) => ({ default: m.ManufacturerCategoryLandingPage })));
const DealerOS = lazy(() => import('./pages/DealerOS').then((module) => ({ default: module.DealerOS })));
const DealerOnboarding = lazy(() => import('./pages/DealerOnboarding'));
const Profile = lazy(() => import('./pages/Profile').then((module) => ({ default: module.Profile })));
const SubscriptionSuccess = lazy(() => import('./pages/SubscriptionSuccess').then((module) => ({ default: module.SubscriptionSuccess })));
const Privacy = lazy(() => import('./pages/Privacy').then((module) => ({ default: module.Privacy })));
const Terms = lazy(() => import('./pages/Terms').then((module) => ({ default: module.Terms })));
const Cookies = lazy(() => import('./pages/Cookies').then((module) => ({ default: module.Cookies })));
const Bookmarks = lazy(() => import('./pages/Bookmarks').then((module) => ({ default: module.Bookmarks })));
const Dmca = lazy(() => import('./pages/Dmca').then((module) => ({ default: module.Dmca })));
const NotFound = lazy(() => import('./pages/NotFound').then((module) => ({ default: module.NotFound })));
const AuctionDetail = lazy(() => import('./pages/AuctionDetail').then((module) => ({ default: module.AuctionDetail })));
const AuctionLotDetail = lazy(() => import('./pages/AuctionLotDetail').then((module) => ({ default: module.AuctionLotDetail })));
const BidderRegistration = lazy(() => import('./pages/BidderRegistration').then((module) => ({ default: module.BidderRegistration })));
const Calculator = lazy(() => import('./pages/Calculator').then((module) => ({ default: module.Calculator })));
const Changelog = lazy(() => import('./pages/Changelog').then((module) => ({ default: module.Changelog })));
const VulnerabilityDisclosure = lazy(() => import('./pages/VulnerabilityDisclosure').then((module) => ({ default: module.VulnerabilityDisclosure })));
const Status = lazy(() => import('./pages/Status').then((module) => ({ default: module.Status })));
const HelpCenter = lazy(() => import('./pages/HelpCenter').then((module) => ({ default: module.HelpCenter })));
const HelpArticle = lazy(() => import('./pages/HelpArticle').then((module) => ({ default: module.HelpArticle })));

function RouteLoadingFallback() {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-[1600px] items-center justify-center px-4 py-16 md:px-8">
      <div className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--muted, #78716C)' }}>Loading Page...</div>
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
                    <Route path="/" element={<Home />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/equipment/:slug" element={<ListingDetail />} />
                    <Route path="/equipment/:slug/:publicKey" element={<ListingDetail />} />
                    <Route path="/listing/:id" element={<ListingDetail />} />
                    <Route path="/listing/:id/:slug" element={<ListingDetail />} />
                    <Route path="/seller/:id" element={<RedirectSellerToDealer />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:id" element={<BlogPostDetail />} />
                    <Route path="/blog/:id/:slug" element={<BlogPostDetail />} />
                    <Route path="/logging-equipment-for-sale" element={<LoggingHubPage />} />
                    <Route path="/forestry-equipment-for-sale" element={<ForestryHubPage />} />
                    <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/compare" element={<Compare />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/categories/:categorySlug" element={<CategorySearchPage />} />
                    <Route path="/manufacturers" element={<Manufacturers />} />
                    <Route path="/manufacturers/:manufacturerSlug/models/:modelSlug/:categorySaleSlug" element={<ManufacturerModelCategoryLandingPage />} />
                    <Route path="/manufacturers/:manufacturerSlug/models/:modelSlug" element={<ManufacturerModelLandingPage />} />
                    <Route path="/manufacturers/:manufacturerSlug/:categorySaleSlug" element={<ManufacturerCategoryLandingPage />} />
                    <Route path="/manufacturers/:manufacturerSlug" element={<ManufacturerLandingPage />} />
                    <Route path="/states" element={<States />} />
                    <Route path="/states/:stateSlug/logging-equipment-for-sale" element={<StateMarketLandingPage marketKeyOverride="logging" />} />
                    <Route path="/states/:stateSlug/forestry-equipment-for-sale" element={<StateMarketLandingPage marketKeyOverride="forestry" />} />
                    <Route path="/states/:stateSlug/:categorySaleSlug" element={<StateCategoryLandingPage />} />
                    <Route path="/dealers" element={<Dealers />} />
                    <Route path="/dealers/:id/inventory" element={<SellerProfile />} />
                    <Route path="/dealers/:id/:categorySlug" element={<SellerProfile />} />
                    <Route path="/dealers/:id" element={<SellerProfile />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/sell" element={<ProtectedRoute><SellWorkspaceRoute /></ProtectedRoute>} />
                    <Route path="/dealer-os" element={<ProtectedRoute requireDealerOs><DealerOS /></ProtectedRoute>} />
                    <Route path="/dealer-onboarding" element={<ProtectedRoute requireDealerOs><DealerOnboarding /></ProtectedRoute>} />
                    <Route path="/account" element={<ProtectedRoute><AccountWorkspaceRedirect /></ProtectedRoute>} />
                    <Route path="/financing" element={<Financing />} />
                    <Route path="/calculator" element={<Suspense fallback={<div />}><Calculator /></Suspense>} />
                    <Route path="/logistics" element={<Logistics />} />
                    <Route path="/profile" element={<ProtectedRoute><ProfileWorkspaceRoute /></ProtectedRoute>} />
                    <Route path="/about" element={<About />} />
                    <Route path="/about-us" element={<About />} />
                    <Route path="/faq" element={<Faq />} />
                    <Route path="/help" element={<HelpCenter />} />
                    <Route path="/help/:slug" element={<HelpArticle />} />
                    <Route path="/our-team" element={<OurTeam />} />
                    <Route path="/about/our-team" element={<OurTeam />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/ad-programs" element={<AdPrograms />} />
                    <Route path="/subscription-success" element={<SubscriptionSuccess />} />
                    <Route path="/auctions" element={<Auctions />} />
                    <Route path="/bidder-registration" element={<ProtectedRoute><Suspense fallback={<div />}><BidderRegistration /></Suspense></ProtectedRoute>} />
                    <Route path="/auctions/:auctionSlug/register" element={<Suspense fallback={<div />}><BidderRegistration /></Suspense>} />
                    <Route path="/auctions/:auctionSlug/lots/:lotNumber" element={<Suspense fallback={<div />}><AuctionLotDetail /></Suspense>} />
                    <Route path="/auctions/:auctionSlug" element={<Suspense fallback={<div />}><AuctionDetail /></Suspense>} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/cookies" element={<Cookies />} />
                    <Route path="/dmca" element={<Dmca />} />
                    <Route path="/vulnerability-disclosure" element={<VulnerabilityDisclosure />} />
                    <Route path="/status" element={<Status />} />
                    <Route path="/changelog" element={<Suspense fallback={<div />}><Changelog /></Suspense>} />
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
