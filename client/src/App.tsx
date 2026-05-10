import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LandingPage from './pages/public/LandingPage';
import CheckoutPage from './pages/public/CheckoutPage';
import PaymentPage from './pages/public/PaymentPage';
import StatusPage from './pages/public/StatusPage';
import AgentGate from './pages/agent/AgentGate';
import AgentPlans from './pages/agent/AgentPlans';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedAdminRoute from './components/auth/ProtectedAdminRoute';
import ProtectedAgentRoute from './components/auth/ProtectedAgentRoute';
import NotFoundPage from './pages/public/NotFoundPage';
import ScrollToTop from './components/utils/ScrollToTop';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Layout>
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
      </Layout>
    </Router>
  );
}

export default App;
