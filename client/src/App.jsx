import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import HomePage from './pages/HomePage';
import BooksPage from './pages/BooksPage';
import BookDetailsPage from './pages/BookDetailsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import ProfilePage from './pages/ProfilePage';
import AdminLayout from './components/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminBooksPage from './pages/AdminBooksPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminReviewsPage from './pages/AdminReviewsPage';
import AdminOrderDetailPage from './pages/AdminOrderDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import InfoPage from './pages/InfoPage';
import AdminMessagesPage from './pages/AdminMessagesPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="app-shell">
            <Navbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/books" element={<BooksPage />} />
              <Route path="/books/:id" element={<BookDetailsPage />} />
              <Route path="/about" element={<InfoPage />} />
              <Route path="/contact" element={<InfoPage />} />
              <Route path="/faq" element={<InfoPage />} />
              <Route path="/privacy" element={<InfoPage />} />
              <Route path="/terms" element={<InfoPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboardPage />} />
                    <Route path="books" element={<AdminBooksPage />} />
                    <Route path="orders" element={<AdminOrdersPage />} />
                    <Route path="orders/:id" element={<AdminOrderDetailPage />} />
                    <Route path="users" element={<AdminUsersPage />} />
                    <Route path="reviews" element={<AdminReviewsPage />} />
                    <Route path="messages" element={<AdminMessagesPage />} />
                  </Route>
                </Route>
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <Footer />
            <Toaster position="top-right" toastOptions={{ duration: 3000, className: 'toast-custom' }} />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
