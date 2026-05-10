import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedAdminRoute from './components/auth/ProtectedAdminRoute';
import ProtectedAgentRoute from './components/auth/ProtectedAgentRoute';
import ScrollToTop from './components/utils/ScrollToTop';
import { Loader2 } from 'lucide-react';

// Route-level code splitting — each page loads as its own chunk
const LandingPage    = lazy(() => import('./pages/public/LandingPage'));
const CheckoutPage   = lazy(() => import('./pages/public/CheckoutPage'));
const PaymentPage    = lazy(() => import('./pages/public/PaymentPage'));
const StatusPage     = lazy(() => import('./pages/public/StatusPage'));
const NotFoundPage   = lazy(() => import('./pages/public/NotFoundPage'));
const AgentGate      = lazy(() => import('./pages/agent/AgentGate'));
const AgentPlans     = lazy(() => import('./pages/agent/AgentPlans'));
const AdminLogin     = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface">
    <Loader2 className="w-8 h-8 animate-spin text-navy" />
  </div>
);

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            {/* Public Routes */}
            <Route path="/checkout/:planId" element={<CheckoutPage />} />
            <Route path="/payment/:orderId" element={<PaymentPage />} />
            <Route path="/status" element={<StatusPage />} />
            <Route path="/status/:orderRef" element={<StatusPage />} />

            {/* Agent Routes */}
            <Route path="/partner-vault" element={<AgentGate />} />
            <Route
              path="/partner-vault/plans"
              element={
                <ProtectedAgentRoute>
                  <AgentPlans />
                </ProtectedAgentRoute>
              }
            />

            {/* Admin Routes */}
            <Route path="/staff-hq/login" element={<AdminLogin />} />
            <Route
              path="/staff-hq/dashboard"
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
}

export default App;
