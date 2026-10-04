import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { NotificationProvider } from '@/lib/NotificationContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navigate } from 'react-router-dom';
import SessionTimeoutWarning from '@/components/SessionTimeoutWarning';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ErrorBoundary from '@/components/ErrorBoundary';
import { PageSkeleton } from '@/components/SkeletonLoaders';
import SkipLink from '@/components/SkipLink';
import { initSentry } from '@/lib/sentry';
import { initLogRocket } from '@/lib/logrocket';

// Initialize error tracking and session recording
initSentry();
initLogRocket();

// Lazy load pages for better performance
const StoreLayout = lazy(() => import('@/components/store/StoreLayout'));
const Home = lazy(() => import('@/pages/Home'));
const Shop = lazy(() => import('@/pages/Shop'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const About = lazy(() => import('@/pages/About'));
const Profile = lazy(() => import('@/pages/Profile'));
const UserOrders = lazy(() => import('@/pages/UserOrders'));
const Payment = lazy(() => import('@/pages/Payment'));
const Categories = lazy(() => import('@/pages/Categories'));
const OrderReceipt = lazy(() => import('@/pages/OrderReceipt'));
const OrderTracking = lazy(() => import('@/pages/OrderTracking'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'));
const AdminRoute = lazy(() => import('@/components/AdminRoute'));
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const Products = lazy(() => import('@/pages/admin/Products'));
const Orders = lazy(() => import('@/pages/admin/Orders'));
const Chat = lazy(() => import('@/pages/admin/Chat'));
const DiscountCodes = lazy(() => import('@/pages/admin/DiscountCodes'));
const AdminCategories = lazy(() => import('@/pages/admin/Categories'));
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));
const SupabaseDebug = lazy(() => import('@/pages/SupabaseDebug'));

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'account_deleted') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#071f15] via-[#051510] to-[#0a3d2e] flex items-center justify-center p-4">
          <div className="bg-[#071f15] border border-[#22C55E]/10 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="font-heading font-bold text-2xl text-white mb-2">Account Deleted</h1>
            <p className="text-white/60 text-sm mb-6">
              {authError.message}
            </p>
            <Link to="/login">
              <Button className="bg-[#22C55E] text-[#051510] hover:bg-[#16a34a] font-semibold rounded-xl w-full">
                Go to Login
              </Button>
            </Link>
          </div>
        </div>
      );
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={
        <Suspense fallback={<PageSkeleton />}>
          <Login />
        </Suspense>
      } />
      <Route path="/register" element={
        <Suspense fallback={<PageSkeleton />}>
          <Register />
        </Suspense>
      } />
      <Route path="/forgot-password" element={
        <Suspense fallback={<PageSkeleton />}>
          <ForgotPassword />
        </Suspense>
      } />
      <Route path="/reset-password" element={
        <Suspense fallback={<PageSkeleton />}>
          <ResetPassword />
        </Suspense>
      } />
      <Route path="/admin/login" element={
        <Suspense fallback={<PageSkeleton />}>
          <AdminLogin />
        </Suspense>
      } />
      <Route path="/debug" element={
        <Suspense fallback={<PageSkeleton />}>
          <SupabaseDebug />
        </Suspense>
      } />

      {/* Public store - accessible without auth */}
      <Route element={
        <Suspense fallback={<PageSkeleton />}>
          <StoreLayout />
        </Suspense>
      }>
        <Route path="/" element={
          <Suspense fallback={<PageSkeleton />}>
            <Home />
          </Suspense>
        } />
        <Route path="/shop" element={
          <Suspense fallback={<PageSkeleton />}>
            <Shop />
          </Suspense>
        } />
        <Route path="/categories" element={
          <Suspense fallback={<PageSkeleton />}>
            <Categories />
          </Suspense>
        } />
        <Route path="/product/:id" element={
          <Suspense fallback={<PageSkeleton />}>
            <ProductDetail />
          </Suspense>
        } />
        <Route path="/about" element={
          <Suspense fallback={<PageSkeleton />}>
            <About />
          </Suspense>
        } />
        
        {/* Protected routes - require auth */}
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route path="/checkout" element={
            <Suspense fallback={<PageSkeleton />}>
              <Checkout />
            </Suspense>
          } />
          <Route path="/order/:id" element={
            <Suspense fallback={<PageSkeleton />}>
              <OrderReceipt />
            </Suspense>
          } />
          <Route path="/track/:id" element={
            <Suspense fallback={<PageSkeleton />}>
              <OrderTracking />
            </Suspense>
          } />
          <Route path="/profile" element={
            <Suspense fallback={<PageSkeleton />}>
              <Profile />
            </Suspense>
          } />
          <Route path="/orders" element={
            <Suspense fallback={<PageSkeleton />}>
              <UserOrders />
            </Suspense>
          } />
          <Route path="/payment" element={
            <Suspense fallback={<PageSkeleton />}>
              <Payment />
            </Suspense>
          } />
        </Route>
      </Route>

      {/* Admin (protected — admin role required) */}
      <Route element={
        <Suspense fallback={<PageSkeleton />}>
          <AdminRoute />
        </Suspense>
      }>
        <Route element={
          <Suspense fallback={<PageSkeleton />}>
            <AdminLayout />
          </Suspense>
        }>
          <Route path="/admin" element={
            <Suspense fallback={<PageSkeleton />}>
              <Dashboard />
            </Suspense>
          } />
          <Route path="/admin/products" element={
            <Suspense fallback={<PageSkeleton />}>
              <Products />
            </Suspense>
          } />
          <Route path="/admin/orders" element={
            <Suspense fallback={<PageSkeleton />}>
              <Orders />
            </Suspense>
          } />
          <Route path="/admin/chat" element={
            <Suspense fallback={<PageSkeleton />}>
              <Chat />
            </Suspense>
          } />
          <Route path="/admin/discount-codes" element={
            <Suspense fallback={<PageSkeleton />}>
              <DiscountCodes />
            </Suspense>
          } />
          <Route path="/admin/categories" element={
            <Suspense fallback={<PageSkeleton />}>
              <AdminCategories />
            </Suspense>
          } />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <SkipLink />
              <ScrollToTop />
              <AuthenticatedApp />
              <SessionTimeoutWarning />
            </Router>
            <Toaster />
          </QueryClientProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App