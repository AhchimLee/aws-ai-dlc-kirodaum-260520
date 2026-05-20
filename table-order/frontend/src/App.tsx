import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { OrdersPage } from './pages/OrdersPage';
import { SetupPage } from './pages/SetupPage';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminMenus } from './pages/AdminMenus';
import { AdminSessions } from './pages/AdminSessions';
import { storage } from './storage';

function RequireConfig({ children }: { children: React.ReactNode }) {
  const config = storage.getConfig();
  if (!config) return <Navigate to="/setup" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const admin = storage.getAdmin();
  if (!admin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/menu" element={<RequireConfig><MenuPage /></RequireConfig>} />
        <Route path="/cart" element={<RequireConfig><CartPage /></RequireConfig>} />
        <Route path="/orders" element={<RequireConfig><OrdersPage /></RequireConfig>} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        <Route path="/admin/menus" element={<RequireAdmin><AdminMenus /></RequireAdmin>} />
        <Route path="/admin/sessions" element={<RequireAdmin><AdminSessions /></RequireAdmin>} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    </ToastProvider>
  );
}
