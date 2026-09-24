import {
  Fish,
  ShoppingBag,
  LogOut,
  User,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import "./CustomerHome.css";
const CustomerHome = () => {
  const { user, logout } = useAuth();

  const navigate = useNavigate();

  return (
    <div className="customer-page">
      <nav className="navbar">
        <div className="logo">
          <div className="logo-mark">
            <Fish size={20} />
          </div>
<img src="/logo.png" alt="Fish & Chicken" className="navbar-logo" />
        </div>

        <div className="nav-actions">
          <div className="user-chip">
            <User size={16} />

            <span>
              {user?.name || user?.phone}
            </span>
          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </nav>

      <main className="hero-section">
        <div className="hero-content">
          <p className="eyebrow">
            TODAY'S FRESH SELECTION
          </p>

          <h1>
            Fresh fish. 
            <br />
           
            <span> Fresh chicken.</span>
          </h1>

          <p>
            Browse today's available fish and
            chicken. Choose your
            quantity and order easily.
          </p>

         <div className="customer-home-actions">

  <button
    onClick={() => navigate("/products")}
  >
    View Today's Products
  </button>

  <button
    onClick={() => navigate("/my-orders")}
  >
    My Orders
  </button>

</div>
        </div>

        <div className="hero-food-card">
          <div className="food-glow"></div>

          <Fish
            size={100}
            strokeWidth={1}
          />

          <h3>Fresh Every Day</h3>

          <p>
            Carefully selected quality products
          </p>
        </div>
      </main>
    </div>
  );
};

export default CustomerHome;