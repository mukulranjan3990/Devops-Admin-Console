import React, { useState, useEffect } from "react";
import api from "../api";
import ForgotPasswordModal from "./ForgotPasswordModal";
import {
  Shield,
  Lock,
  User,
  AlertCircle,
  KeyRound,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Server
} from "lucide-react";

/**
 * Secure Login Component
 * Built with pure JavaScript, Tailwind CSS, and strict client-side validation
 * Communicates with Java 21 Spring Boot Tier 2 REST endpoint (/api/auth/login)
 */
export default function LoginPage({ onLoginSuccess }) {
  // Input states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Validation states
  const [fieldErrors, setFieldErrors] = useState({ username: "", password: "" });
  const [touched, setTouched] = useState({ username: false, password: false });
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // Security & rate-limiting protection
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Countdown timer for lockout cooldown
  useEffect(() => {
    let timer;
    if (cooldownSeconds > 0) {
      timer = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Validation rules engine
  const validateField = (name, value) => {
    if (name === "username") {
      const trimmed = value.trim();
      if (!trimmed) {
        return "Username is required";
      }
      if (trimmed.length < 3) {
        return "Username must be at least 3 characters";
      }
      if (trimmed.length > 50) {
        return "Username cannot exceed 50 characters";
      }
      // Alphanumeric, underscores, hyphens, and periods
      const validChars = /^[a-zA-Z0-9_.-]+$/;
      if (!validChars.test(trimmed)) {
        return "Username may only contain letters, numbers, '.', '_', or '-'";
      }
      return "";
    }

    if (name === "password") {
      if (!value) {
        return "Password is required";
      }
      if (value.length < 6) {
        return "Password must be at least 6 characters";
      }
      if (value.length > 128) {
        return "Password cannot exceed 128 characters";
      }
      return "";
    }

    return "";
  };

  // Handlers for real-time validation
  const handleUsernameChange = (e) => {
    const val = e.target.value;
    setUsername(val);
    setServerError("");
    if (touched.username) {
      setFieldErrors((prev) => ({ ...prev, username: validateField("username", val) }));
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setServerError("");
    if (touched.password) {
      setFieldErrors((prev) => ({ ...prev, password: validateField("password", val) }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const val = field === "username" ? username : password;
    setFieldErrors((prev) => ({ ...prev, [field]: validateField(field, val) }));
  };

  // Form submission & POST request handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cooldownSeconds > 0) {
      return;
    }

    // Mark all touched and validate
    setTouched({ username: true, password: true });
    const userErr = validateField("username", username);
    const passErr = validateField("password", password);

    setFieldErrors({ username: userErr, password: passErr });

    if (userErr || passErr) {
      return;
    }

    const sanitizedUsername = username.trim();
    setServerError("");
    setLoading(true);

    try {
      // POST request to Spring Boot authentication endpoint
      const response = await api.post("/auth/login", {
        username: sanitizedUsername,
        password: password,
      });

      if (response.data && response.data.token) {
        // Store JWT token securely in localStorage
        localStorage.setItem("jwt_token", response.data.token);
        if (response.data.username) {
          localStorage.setItem("portal_username", response.data.username);
        }
        if (response.data.role) {
          localStorage.setItem("portal_user_role", response.data.role);
        }
        if (response.data.fullName) {
          localStorage.setItem("portal_user_fullname", response.data.fullName);
        }
        setFailedAttempts(0);
        if (typeof onLoginSuccess === "function") {
          onLoginSuccess(response.data);
        }
      } else {
        setServerError("Invalid authentication response received from server.");
      }
    } catch (err) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      // Trigger cooldown on repeated failures
      if (newAttempts >= 5) {
        setCooldownSeconds(15);
        setServerError("Too many failed attempts. Temporary 15-second cooldown activated.");
      } else {
        const errorMsg =
          err.response?.data?.message ||
          (err.response?.status === 401
            ? "Invalid username or password. Please verify credentials."
            : "Unable to reach authentication server. Please check backend status.");
        setServerError(errorMsg);
      }

      // Security practice: clear password field after failed submission
      setPassword("");
      setTouched((prev) => ({ ...prev, password: false }));
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    username.trim().length >= 3 &&
    password.length >= 6 &&
    !fieldErrors.username &&
    !fieldErrors.password;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-cyan-950/20 blur-[130px] rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-[320px] h-[260px] bg-indigo-950/20 blur-[110px] rounded-full" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Tier Indicator */}
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-950/90 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-950/50">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-mono text-xs tracking-wider uppercase text-cyan-400 font-semibold">
            Tier 1 · Secure Authentication
          </span>
        </div>

        <h1 className="text-center text-2xl sm:text-3xl font-bold tracking-tight text-slate-100">
          Admin Portal Login
        </h1>
        <p className="mt-2 text-center text-xs sm:text-sm text-slate-400">
          Java 21 Spring Boot 3 &amp; AWS RDS Session Gateway
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
          {/* Server / Auth Error Alert */}
          {serverError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 p-3.5 bg-rose-950/50 border border-rose-800/70 rounded-lg text-rose-200 text-sm transition-all"
            >
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-rose-300">Authentication Failed</p>
                <p className="text-xs text-rose-300/90 mt-0.5">{serverError}</p>
              </div>
            </div>
          )}

          {/* Rate-limit Cooldown Notification */}
          {cooldownSeconds > 0 && (
            <div
              role="alert"
              className="mb-5 flex items-center gap-2.5 p-3 bg-amber-950/50 border border-amber-800/70 rounded-lg text-amber-200 text-xs font-mono"
            >
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Rate limit triggered: try again in {cooldownSeconds}s</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Username Input Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="username"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Username
                </label>
                {touched.username && !fieldErrors.username && username.trim().length >= 3 && (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                    <CheckCircle2 className="w-3 h-3" /> Valid
                  </span>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  disabled={loading || cooldownSeconds > 0}
                  value={username}
                  onChange={handleUsernameChange}
                  onBlur={() => handleBlur("username")}
                  placeholder="Enter your username"
                  aria-invalid={touched.username && !!fieldErrors.username}
                  aria-describedby={fieldErrors.username ? "username-error" : undefined}
                  className={`w-full pl-10 pr-3 py-2.5 bg-slate-950 border rounded-lg text-slate-100 placeholder:text-slate-600 text-sm font-mono transition-colors focus:outline-none focus:ring-2 ${
                    touched.username && fieldErrors.username
                      ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30"
                      : "border-slate-700/80 focus:border-cyan-500 focus:ring-cyan-500/30"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                />
              </div>

              {touched.username && fieldErrors.username && (
                <p id="username-error" role="alert" className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {fieldErrors.username}
                </p>
              )}
            </div>

            {/* Password Input Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  disabled={loading || cooldownSeconds > 0}
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => handleBlur("password")}
                  placeholder="Enter your password"
                  aria-invalid={touched.password && !!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-950 border rounded-lg text-slate-100 placeholder:text-slate-600 text-sm font-mono transition-colors focus:outline-none focus:ring-2 ${
                    touched.password && fieldErrors.password
                      ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30"
                      : "border-slate-700/80 focus:border-cyan-500 focus:ring-cyan-500/30"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={loading || cooldownSeconds > 0}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {touched.password && fieldErrors.password && (
                <p id="password-error" role="alert" className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || cooldownSeconds > 0 || !isFormValid}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-950/40 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : cooldownSeconds > 0 ? (
                <span>Cooling Down ({cooldownSeconds}s)</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Secure Credential Input Notice */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Manual Verification Active
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                BCrypt / Salted
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed font-sans">
              Enter your administrator or assigned user account credentials manually to initiate an authenticated session.
            </p>
          </div>
        </div>

        {/* Security Specs Footer */}
        <div className="mt-6 flex items-center justify-between text-xs text-slate-500 px-1 font-mono">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            BCrypt + HMAC-SHA256
          </span>
          <span className="flex items-center gap-1">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            Port 8080 REST
          </span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        initialEmail={username.includes("@") ? username : "admin@devopsportal.com"}
      />
    </div>
  );
}

// Named export for flexible component import patterns
export { LoginPage as Login };
