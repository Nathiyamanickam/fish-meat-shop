import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Login
import CustomerLogin from "./pages/CustomerLogin";
import AdminLogin from "./pages/AdminLogin";

// Customer
import CustomerHome from "./pages/CustomerHome";
import TodayProducts from "./pages/customer/TodayProducts";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import Payment from "./pages/customer/Payment";
import MyOrders from "./pages/customer/MyOrders";

// Admin
import AdminDashboard from "./pages/AdminDashboard";
import DailyInventory from "./pages/admin/DailyInventory";
import AdminOrders from "./pages/admin/AdminOrders";
import SalesIncome from "./pages/admin/SalesIncome";
import CustomerAnalytics
  from "./pages/admin/CustomerAnalytics";
  import Payments
  from "./pages/admin/Payments";
  import Receipt
  from "./pages/customer/Receipt";
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* =========================================
              CUSTOMER LOGIN
          ========================================= */}
          <Route
            path="/login"
            element={<CustomerLogin />}
          />

          {/* =========================================
              ADMIN LOGIN
          ========================================= */}
          <Route
            path="/admin/login"
            element={<AdminLogin />}
          />

          {/* =========================================
              CUSTOMER HOME
          ========================================= */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <CustomerHome />
              </ProtectedRoute>
            }
          />

          {/* =========================================
              CUSTOMER PRODUCTS
          ========================================= */}
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <TodayProducts />
              </ProtectedRoute>
            }
          />

{/* =========================================
    CUSTOMER CART
========================================= */}
<Route
  path="/cart"
  element={
    <ProtectedRoute>
      <Cart />
    </ProtectedRoute>
  }
/>  

          {/* =========================================
              CUSTOMER CHECKOUT
          ========================================= */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />

          {/* =========================================
              CUSTOMER PAYMENT
          ========================================= */}
          <Route
            path="/payment/:orderId"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />

          {/* =========================================
              CUSTOMER MY ORDERS
          ========================================= */}
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            }
          />

          {/* =========================================
              ADMIN DASHBOARD
          ========================================= */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* =========================================
              ADMIN DAILY INVENTORY
          ========================================= */}
          <Route
            path="/admin/daily-inventory"
            element={
              <ProtectedRoute adminOnly>
                <DailyInventory />
              </ProtectedRoute>
            }
          />

          {/* =========================================
              ADMIN ORDERS
          ========================================= */}
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute adminOnly>
                <AdminOrders />
              </ProtectedRoute>
            }
          />

          <Route
  path="/admin/sales"
  element={
    <ProtectedRoute adminOnly>
      <SalesIncome />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/customers"
  element={
    <ProtectedRoute adminOnly>
      <CustomerAnalytics />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/payments"
  element={
    <ProtectedRoute adminOnly>
      <Payments />
    </ProtectedRoute>
  }
/>

<Route
  path="/receipt/:orderId"
  element={
    <ProtectedRoute>
      <Receipt />
    </ProtectedRoute>
  }
/>
          {/* =========================================
              UNKNOWN URL
              MUST BE LAST
          ========================================= */}
          <Route
            path="*"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;