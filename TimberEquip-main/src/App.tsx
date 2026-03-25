import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeContext';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Home } from './pages/Home';
import { ScrollToTop } from './components/ScrollToTop';
import { LocaleProvider } from './components/LocaleContext';

import { AuthProvider } from './components/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MotionConfig } from 'framer-motion';

const Search = lazy(() => import('./pages/Search').then((module) => ({ default: module.Search })));
const ListingDetail = lazy(() => import('./pages/ListingDetail').then((module) => ({ default: module.ListingDetail })));
const SellerProfile = lazy(() => import('./pages/SellerProfile').then((module) => ({ default: module.SellerProfile })));
const Blog = lazy(() => import('./pages/Blog').then((module) => ({ default: module.Blog })));
const BlogPostDetail = lazy(() => import('./pages/BlogPostDetail').then((module) => ({ default: module.BlogPostDetail })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const Compare = lazy(() => import('./pages/Compare').then((module) => ({ default: module.Compare })));
const Categories = lazy(() => import('./pages/Categories').then((module) => ({ default: module.Categories })));
const Login = lazy(() => import('./pages/Login').then((module) => ({ default: module.Login })));
const Register = lazy(() => import('./pages/Register').then((module) => ({ default: module.Register })));
const Sell = lazy(() => import('./pages/Sell').then((module) => ({ default: module.Sell })));
const Financing = lazy(() => import('./pages/Financing').then((module) => ({ default: module.Financing })));
const Profile = lazy(() => import('./pages/Profile').then((module) => ({ default: module.Profile })));
const About = lazy(() => import('./pages/About').then((module) => ({ default: module.About })));
const Contact = lazy(() => import('./pages/Contact').then((module) => ({ default: module.Contact })));
const AdPrograms = lazy(() => import('./pages/AdPrograms').then((module) => ({ default: module.AdPrograms })));
const Inspections = lazy(() => import('./pages/Inspections').then((module) => ({ default: module.Inspections })));
const Auctions = lazy(() => import('./pages/Auctions').then((module) => ({ default: module.Auctions })));
const Privacy = lazy(() => import('./pages/Privacy').then((module) => ({ default: module.Privacy })));
const Terms = lazy(() => import('./pages/Terms').then((module) => ({ default: module.Terms })));
const Cookies = lazy(() => import('./pages/Cookies').then((module) => ({ default: module.Cookies })));
const Bookmarks = lazy(() => import('./pages/Bookmarks').then((module) => ({ default: module.Bookmarks })));

function RouteLoadingFallback() {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-[1600px] items-center justify-center px-4 py-16 md:px-8">
      <div className="text-[11px] font-black uppercase tracking-widest text-muted">Loading Page...</div>
    </div>
  );
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
                    <Route path="/listing/:id" element={<ListingDetail />} />
                    <Route path="/listing/:id/:slug" element={<ListingDetail />} />
                    <Route path="/seller/:id" element={<SellerProfile />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:id" element={<BlogPostDetail />} />
                    <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/compare" element={<Compare />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/sell" element={<ProtectedRoute><Sell /></ProtectedRoute>} />
                    <Route path="/financing" element={<Financing />} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/ad-programs" element={<AdPrograms />} />
                    <Route path="/inspections" element={<Inspections />} />
                    <Route path="/auctions" element={<Auctions />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/cookies" element={<Cookies />} />
                    <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
                    {/* Fallback for other routes */}
                    <Route path="*" element={<Home />} />
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
