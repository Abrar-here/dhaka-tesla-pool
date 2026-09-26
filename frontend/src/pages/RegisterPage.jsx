import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { COLORS, fontDisplay } from "../theme";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "passenger",
    phone: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await register(form);
      navigate(user.role === "driver" ? "/driver" : "/passenger");
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          "Registration failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    backgroundColor: COLORS.surfaceMuted,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.ink,
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ backgroundColor: COLORS.bg }}
    >
      <div
        className="pointer-events-none fixed -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: COLORS.primary }}
      />
      <div
        className="pointer-events-none fixed -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-10"
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
            Join the pool. First ride is always cheaper shared.
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
            Create your account
          </h1>
          <p style={{ color: COLORS.inkMuted }} className="text-sm mb-6">
            Sign up as a passenger or a driver
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Role toggle */}
            <div>
              <label
                className="block text-xs font-medium mb-2"
                style={{ color: COLORS.inkMuted }}
              >
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                {["passenger", "driver"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => update("role", r)}
                    className="py-2.5 rounded-xl text-sm font-semibold capitalize transition"
                    style={
                      form.role === r
                        ? { backgroundColor: COLORS.primary, color: "#06201A" }
                        : {
                            backgroundColor: COLORS.surfaceMuted,
                            color: COLORS.inkMuted,
                            border: `1px solid ${COLORS.border}`,
                          }
                    }
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: COLORS.inkMuted }}
              >
                Full Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Nusrat Jahan"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: COLORS.inkMuted }}
              >
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: COLORS.inkMuted }}
              >
                Phone (optional)
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
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
                required
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
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
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p
            className="mt-6 text-center text-sm"
            style={{ color: COLORS.inkMuted }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              style={{ color: COLORS.primary }}
              className="font-medium"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
