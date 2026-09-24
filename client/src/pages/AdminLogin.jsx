import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LockKeyhole,
  Phone,
  ArrowRight,
  ChefHat,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const AdminLogin = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] =
    useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] =
    useState(false);

  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!phone || !password) {
      setError(
        "Please enter phone number and password"
      );
      return;
    }

    try {
      setLoading(true);

      await adminLogin(phone, password);

      navigate("/admin");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Invalid credentials"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page admin-auth">
      <div className="auth-background"></div>

      <div className="auth-card">
        <div className="brand-icon">
          <ChefHat size={30} />
        </div>

        <p className="eyebrow">
          SHOP MANAGEMENT
        </p>

        <h1>
          Admin
          <span> Portal</span>
        </h1>

        <p className="auth-description">
          Manage products, orders, payments
          and daily sales.
        </p>

        <form onSubmit={handleSubmit}>
          <label>Admin Mobile Number</label>

          <div className="phone-input">
            <span>+91</span>

            <Phone size={18} />

            <input
              type="tel"
              placeholder="Admin phone number"
              maxLength="10"
              value={phone}
              onChange={(e) =>
                setPhone(
                  e.target.value.replace(/\D/g, "")
                )
              }
            />
          </div>

          <label>Password</label>

          <div className="password-input">
            <LockKeyhole size={18} />

            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />
          </div>

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          <button
            className="primary-button"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Admin Sign In"}

            {!loading && (
              <ArrowRight size={19} />
            )}
          </button>
        </form>

        <button
          className="admin-link"
          onClick={() => navigate("/login")}
        >
          ← Customer Login
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;