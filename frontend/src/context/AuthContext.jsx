import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, registerUser } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, restore the session from localStorage if present.
  useEffect(() => {
    const storedUser = localStorage.getItem("dtp_user");
    const storedToken = localStorage.getItem("dtp_token");
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  function persistSession(user, token) {
    localStorage.setItem("dtp_user", JSON.stringify(user));
    localStorage.setItem("dtp_token", token);
    setUser(user);
  }

  async function login(email, password) {
    const { user, token } = await loginUser({ email, password });
    persistSession(user, token);
    return user;
  }

  async function register(payload) {
    const { user, token } = await registerUser(payload);
    persistSession(user, token);
    return user;
  }

  function logout() {
    localStorage.removeItem("dtp_user");
    localStorage.removeItem("dtp_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
