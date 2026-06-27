import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import Layout from './components/common/Layout'
import PrivateRoute from './components/common/PrivateRoute'
import RoleRoute from './components/common/RoleRoute'

import HomePage from './pages/HomePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ProductsPage from './pages/products/ProductsPage'
import ProductDetailPage from './pages/products/ProductDetailPage'
import CategoriesPage from './pages/CategoriesPage'
import SearchPage from './pages/SearchPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage from './pages/orders/OrdersPage'
import OrderDetailPage from './pages/orders/OrderDetailPage'
import FavoritesPage from './pages/FavoritesPage'
import MessagesPage from './pages/messages/MessagesPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'

import SellerDashboardPage from './pages/seller/SellerDashboardPage'
import MyProductsPage from './pages/seller/MyProductsPage'
import ProductFormPage from './pages/seller/ProductFormPage'
import SellerOrdersPage from './pages/seller/SellerOrdersPage'

import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminCouponsPage from './pages/admin/AdminCouponsPage'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            {/* Pages d'authentification (plein écran, sans navbar) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Application principale avec navbar */}
            <Route element={<Layout />}>
              {/* Public */}
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/search" element={<SearchPage />} />

              {/* Routes protégées (authentifié) */}
              <Route element={<PrivateRoute />}>
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/messages/:userId" element={<MessagesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* Espace vendeur */}
              <Route element={<RoleRoute role="seller" />}>
                <Route path="/seller" element={<SellerDashboardPage />} />
                <Route path="/seller/products" element={<MyProductsPage />} />
                <Route path="/seller/products/new" element={<ProductFormPage />} />
                <Route path="/seller/products/:id/edit" element={<ProductFormPage />} />
                <Route path="/seller/orders" element={<SellerOrdersPage />} />
              </Route>

              {/* Espace administrateur */}
              <Route element={<RoleRoute role="admin" />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/products" element={<AdminProductsPage />} />
                <Route path="/admin/coupons" element={<AdminCouponsPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
