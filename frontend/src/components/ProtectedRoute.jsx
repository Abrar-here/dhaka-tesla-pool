import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wraps a page so it's only reachable when logged in, and optionally
// restricted to a specific role (e.g. "driver" or "passenger").
export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Logged in, but wrong role - send them to their own dashboard
    // instead of showing a confusing 403 page.
    return (
      <Navigate
        to={user.role === "driver" ? "/driver" : "/passenger"}
        replace
      />
    );
  }

  return children;
}
