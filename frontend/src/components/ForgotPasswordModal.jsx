import React, { useState, useEffect, useRef } from "react";
import api from "../api";
import {
  Mail,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Clock,
  RotateCw,
  ExternalLink
} from "lucide-react";

/**
 * Forgot Password Modal Component
 * Handles client-side email validation and simulates the password recovery backend flow.
 */
export default function ForgotPasswordModal({ isOpen, onClose, initialEmail = "" }) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const inputRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || "");
      setError("");
      setTouched(false);
      setIsSuccess(false);
      setShowEmailPreview(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialEmail]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  // Resend cooldown timer
  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const validateEmail = (val) => {
    const trimmed = val.trim();
    if (!trimmed) {
      return "Email address is required";
    }
    // RFC 5322 simplified email regex pattern
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
    if (!emailRegex.test(trimmed)) {
      return "Please enter a valid email address (e.g., admin@devopsportal.com)";
    }
    return "";
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setError("");
    if (touched) {
      setError(validateEmail(val));
    }
  };

  const handleBlur = () => {
    setTouched(true);
    setError(validateEmail(email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    const validationErr = validateEmail(email);
    if (validationErr) {
      setError(validationErr);
      return;
    }

    const targetEmail = email.trim();
    setError("");
    setLoading(true);

    try {
      // Simulate backend service delay & call auth recovery endpoint
      const response = await api.post("/auth/forgot-password", {
        email: targetEmail,
      });

      if (response.data && response.data.success) {
        setSubmittedEmail(targetEmail);
        setIsSuccess(true);
        setResendCooldown(30);
      } else {
        setError(response.data?.message || "Failed to initiate recovery request.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Unable to send recovery email. Please verify network connection.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/forgot-password", { email: submittedEmail });
      setResendCooldown(30);
    } catch {
      setError("Failed to resend recovery email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 sm:p-7 text-slate-100 transition-all">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Close modal"
          className="absolute top-5 right-5 text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSuccess ? (
          <div>
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 id="forgot-password-title" className="text-lg font-bold text-slate-100">
                  Reset Password
                </h2>
                <p className="text-xs text-slate-400">
                  Tier 2 Spring Boot Password Recovery
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Enter the email address associated with your administrator account. We will dispatch a secure one-time reset link.
            </p>

            {/* Error Banner */}
            {error && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 p-3 bg-rose-950/50 border border-rose-800/70 rounded-lg text-rose-200 text-xs"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="recovery-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Admin Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    ref={inputRef}
                    id="recovery-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={loading}
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleBlur}
                    placeholder="admin@devopsportal.com"
                    aria-invalid={touched && !!error}
                    className={`w-full pl-10 pr-3 py-2.5 bg-slate-950 border rounded-lg text-slate-100 placeholder:text-slate-600 text-sm font-mono transition-colors focus:outline-none focus:ring-2 ${
                      touched && error
                        ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30"
                        : "border-slate-700/80 focus:border-cyan-500 focus:ring-cyan-500/30"
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="w-1/3 py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || (touched && !!error)}
                  className="w-2/3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-medium text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-950/40 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending Link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Recovery Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Helper for Demo Email */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Seeded Admin Email:</span>
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@devopsportal.com");
                  setError("");
                  setTouched(true);
                }}
                className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
              >
                admin@devopsportal.com
              </button>
            </div>
          </div>
        ) : (
          /* Success Screen */
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  Recovery Email Dispatched
                </h2>
                <p className="text-xs text-emerald-400 font-mono">
                  HTTP 200 · Delivery Queued
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              If an account matches <span className="font-mono text-cyan-300 font-medium">{submittedEmail}</span>, instructions to reset your password have been sent.
            </p>

            {/* Security Notice */}
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5 text-slate-400">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Security Guidelines</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                • The password reset token expires in <strong className="text-slate-200">15 minutes</strong>.
              </p>
              <p className="text-[11px] leading-relaxed">
                • Generic response returned by backend to prevent user enumeration attacks.
              </p>
            </div>

            {/* Simulated Email Payload Preview Drawer */}
            <div>
              <button
                type="button"
                onClick={() => setShowEmailPreview(!showEmailPreview)}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 underline font-mono cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" />
                <span>{showEmailPreview ? "Hide Outgoing Mail Simulation" : "View Outgoing Mail Simulation"}</span>
              </button>

              {showEmailPreview && (
                <div className="mt-2.5 p-3 rounded-lg bg-slate-950 border border-slate-800/90 font-mono text-xs text-slate-300 space-y-1.5">
                  <div className="text-slate-500 text-[10px] uppercase">Simulated SMTP Envelope</div>
                  <div><span className="text-slate-500">From:</span> security@devopsportal.internal</div>
                  <div><span className="text-slate-500">To:</span> {submittedEmail}</div>
                  <div><span className="text-slate-500">Subject:</span> [DevOps Portal] Admin Password Reset Token</div>
                  <div className="pt-2 text-slate-400 text-[11px] border-t border-slate-800">
                    Token: <span className="text-amber-300">rst_9f8b2c4e1a0d...</span> (expires in 15m)
                  </div>
                </div>
              )}
            </div>

            {/* Resend & Return to Login Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                className="w-full sm:w-1/2 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>{resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend Link"}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-1/2 py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors cursor-pointer text-center"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
