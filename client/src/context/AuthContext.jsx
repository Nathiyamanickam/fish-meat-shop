import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("fishShopToken");

    if (!token) {
      setLoading(false);
      return;
    }

    const loadUser = async () => {
      try {
        const response = await api.get("/auth/me");

        setUser(response.data.user);
      } catch (error) {
        localStorage.removeItem("fishShopToken");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (phone, name = "") => {
    const response = await api.post(
      "/auth/customer/login",
      {
        phone,
        name,
      }
    );

    localStorage.setItem(
      "fishShopToken",
      response.data.token
    );

    setUser(response.data.user);

    return response.data;
  };

  const adminLogin = async (phone, password) => {
    const response = await api.post(
      "/auth/admin/login",
      {
        phone,
        password,
      }
    );

    localStorage.setItem(
      "fishShopToken",
      response.data.token
    );

    setUser(response.data.user);

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("fishShopToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        adminLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};