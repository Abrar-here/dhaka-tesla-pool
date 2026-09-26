import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { COLORS, fontDisplay } from "../theme";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(user.role === "driver" ? "/driver" : "/passenger");
    } catch (err) {
      setError(
        err.response?.data?.error?.message || "Login failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: COLORS.bg }}
    >
      {/* Ambient glow accents */}
      <div
        className="pointer-events-none fixed -top-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: COLORS.primary }}
      />
      <div
        className="pointer-events-none fixed -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-10"
        style={{ backgroundColor: COLORS.accent }}
      />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-2xl">⚡</span>
            <span
              style={{ ...fontDisplay, color: COLORS.ink }}
              className="text-xl font-bold"
            >
              Dhaka Tesla<span style={{ color: COLORS.primary }}>Pool</span>
            </span>
          </div>
          <p style={{ color: COLORS.inkMuted }} className="text-sm">
            Share a seat. Split the fare. Survive Dhaka traffic.
          </p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <h1
            style={{ ...fontDisplay, color: COLORS.ink }}
            className="text-2xl font-semibold mb-1"
          >
            Welcome back
          </h1>
          <p style={{ color: COLORS.inkMuted }} className="text-sm mb-6">
            Log in to continue your ride
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: COLORS.inkMuted }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition"
                style={{
                  backgroundColor: COLORS.surfaceMuted,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.ink,
                }}
                onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
                onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: COLORS.inkMuted }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition"
                style={{
                  backgroundColor: COLORS.surfaceMuted,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.ink,
                }}
                onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
                onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
              />
            </div>

            {error && (
              <div
                className="text-sm px-3 py-2 rounded-lg"
                style={{ backgroundColor: "#2B1618", color: COLORS.danger }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full py-3 rounded-xl font-semibold text-sm transition disabled:opacity-60"
              style={{ backgroundColor: COLORS.primary, color: "#06201A" }}
            >
              {submitting ? "Logging in..." : "Log In"}
            </button>
          </form>

          <p
            className="mt-6 text-center text-sm"
            style={{ color: COLORS.inkMuted }}
          >
            Don't have an account?{" "}
            <Link
              to="/register"
              style={{ color: COLORS.primary }}
              className="font-medium"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
