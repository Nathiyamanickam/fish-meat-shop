import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, ArrowRight, Fish } from "lucide-react";

import { useAuth } from "../context/AuthContext";

const CustomerLogin = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

<img
  src="/logo.png"
  alt="Fish & Chicken"
  className="login-logo"
/>

    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      setError("Enter a valid 10-digit phone number");
      return;
    }

    try {
      setLoading(true);

      await login(phone, name);

      navigate("/");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background"></div>

      <div className="auth-card">
        <div className="brand-icon">
          <Fish size={30} />
        </div>

        <p className="eyebrow">
          FRESH • DAILY • QUALITY
        </p>
 <h1>Welcome to</h1>
        <h1>
         
          <span> MEEN MACHAN</span>
        </h1>

        <p className="auth-description">
          Fresh fish& chicken,
          prepared for your table.
        </p>

        <form onSubmit={handleSubmit}>
          <label>Your Name</label>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />

          <label>Mobile Number</label>

          <div className="phone-input">
            <span>+91</span>

            <Phone size={18} />

            <input
              type="tel"
              placeholder="10-digit mobile number"
              maxLength="10"
              value={phone}
              onChange={(e) =>
                setPhone(
                  e.target.value.replace(/\D/g, "")
                )
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
              : "Continue"}

            {!loading && (
              <ArrowRight size={19} />
            )}
          </button>
        </form>

        <p className="secure-text">
          No password required • Quick & easy access
        </p>

        <button
          className="admin-link"
          onClick={() => navigate("/admin/login")}
        >
          Admin Login
        </button>
      </div>
    </div>
  );
};

export default CustomerLogin;