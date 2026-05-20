import { Routes, Route } from 'react-router-dom'
import CustomerMenuPage from './pages/CustomerMenuPage'
import CartPage from './pages/CartPage'
import OrderHistoryPage from './pages/OrderHistoryPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminMenuPage from './pages/AdminMenuPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<CustomerMenuPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/orders" element={<OrderHistoryPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      <Route path="/admin/menus" element={<AdminMenuPage />} />
    </Routes>
  )
}

export default App
