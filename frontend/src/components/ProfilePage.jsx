import React, { useEffect, useState, useCallback } from "react";
import api from "../api";
import {
  Server,
  Database,
  Shield,
  User,
  Mail,
  Briefcase,
  Building2,
  Calendar,
  LogOut,
  RefreshCw,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
  Copy,
  Check,
  Key
} from "lucide-react";

export default function ProfilePage({ onLogout }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [actuatorHealth, setActuatorHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedHost, setCopiedHost] = useState(false);
  const [showTokenDetails, setShowTokenDetails] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/profile");
      setProfile(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Session expired or unauthorized token. Redirecting to login...");
        localStorage.removeItem("jwt_token");
        setTimeout(() => onLogout(), 1200);
      } else {
        setError(err.response?.data?.message || "Failed to load profile data from backend API.");
      }
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  const checkHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      // Axios request to Spring Boot Actuator endpoint
      const res = await api.get("/../actuator/health");
      setActuatorHealth(res.data);
    } catch (err) {
      // Fallback relative path try
      try {
        const directRes = await fetch("/actuator/health");
        if (directRes.ok) {
          const data = await directRes.json();
          setActuatorHealth(data);
        } else {
          setActuatorHealth({ status: "DEGRADED", note: "Actuator returned non-200" });
        }
      } catch {
        setActuatorHealth({ status: "UNREACHABLE", note: "Actuator endpoint offline" });
      }
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    checkHealth();
  }, [fetchProfile, checkHealth]);

  const handleLogout = () => {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("portal_username");
    onLogout();
  };

  const currentToken = localStorage.getItem("jwt_token") || "";

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "token") {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } else {
      setCopiedHost(true);
      setTimeout(() => setCopiedHost(false), 2000);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "N/A";
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased py-8 px-4 sm:px-6 lg:px-8">
      {/* Background visual glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-10 right-1/4 w-[500px] h-[300px] bg-cyan-950/20 blur-[130px] rounded-full" />
        <div className="absolute bottom-10 left-1/4 w-[400px] h-[300px] bg-blue-950/20 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Navbar Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-100">
                  {profile?.role === "ADMIN" ? "DevOps Admin Portal" : "DevOps Member Portal"}
                </h1>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                  v{profile?.appVersion || "1.0.0"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tier 1 (React) · Tier 2 (Spring Boot 3 REST) · Tier 3 (AWS RDS)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={() => {
                fetchProfile();
                checkHealth();
              }}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors cursor-pointer"
              title="Refresh profile and actuator health"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/60 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-200 text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && !profile && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-sm font-mono text-slate-400">
              Querying Spring Boot REST API &amp; AWS RDS...
            </p>
          </div>
        )}

        {/* Profile Content */}
        {profile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Primary Profile Card (Left 2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm">
                <div className="flex items-start justify-between pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-lg font-mono">
                      {profile.username?.slice(0, 2).toUpperCase() || "AD"}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-100">{profile.fullName}</h2>
                      <p className="text-xs font-mono text-cyan-400">@{profile.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 font-mono text-xs px-2.5 py-1 rounded-md bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {profile.role || "ADMIN"}
                    </span>
                  </div>
                </div>

                {/* Attributes Grid */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/70">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="uppercase tracking-wider font-semibold">Email Address</span>
                    </div>
                    <p className="font-mono text-slate-200 text-xs sm:text-sm truncate">
                      {profile.email}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/70">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="uppercase tracking-wider font-semibold">Department</span>
                    </div>
                    <p className="text-slate-200 text-xs sm:text-sm font-medium">
                      {profile.department}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/70">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="uppercase tracking-wider font-semibold">Account Created</span>
                    </div>
                    <p className="font-mono text-slate-300 text-xs">
                      {formatDate(profile.createdAt)}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/70">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="uppercase tracking-wider font-semibold">Database Record ID</span>
                    </div>
                    <p className="font-mono text-slate-200 text-xs">
                      #{profile.id} (RDS Primary Key)
                    </p>
                  </div>
                </div>

                {/* DevOps Server Hostname Inspection Banner */}
                <div className="mt-5 p-4 rounded-lg bg-cyan-950/30 border border-cyan-800/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs uppercase tracking-wider font-semibold text-cyan-300 flex items-center gap-1.5">
                      <Server className="w-4 h-4 text-cyan-400" />
                      Serving Backend Host (Tier 2 Node)
                    </span>
                    <button
                      onClick={() => handleCopy(profile.serverHostname, "host")}
                      className="text-xs text-cyan-400 hover:text-cyan-200 flex items-center gap-1 cursor-pointer font-mono"
                    >
                      {copiedHost ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedHost ? "Copied" : "Copy Host"}</span>
                    </button>
                  </div>
                  <p className="font-mono text-sm text-slate-100 bg-slate-950/70 px-3 py-2 rounded border border-slate-800 break-all">
                    {profile.serverHostname}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                    Used by DevOps engineers to verify AWS Application Load Balancer (ALB) round-robin distribution and Kubernetes pod identity across backend replicas.
                  </p>
                </div>
              </section>

              {/* JWT Security Session Inspector */}
              <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>Active JWT Session Bearer Token</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowTokenDetails(!showTokenDetails)}
                      className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                    >
                      {showTokenDetails ? "Hide Raw Token" : "View Raw Token"}
                    </button>
                    <button
                      onClick={() => handleCopy(currentToken, "token")}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                    >
                      {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedToken ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                {showTokenDetails && (
                  <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-400 break-all leading-relaxed">
                    {currentToken || "No token found in localStorage"}
                  </div>
                )}

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono text-slate-400">
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-500 block">Algorithm:</span>
                    <span className="text-slate-200">HMAC-SHA256</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-500 block">Subject:</span>
                    <span className="text-slate-200">{profile.username}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-500 block">Validity:</span>
                    <span className="text-slate-200">24 Hours</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Role-Appropriate Information */}
            <div className="space-y-6">
              {profile.role === "ADMIN" ? (
                <>
                  {/* Spring Boot Actuator Probes */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-bold text-slate-200">Spring Boot Actuator</h3>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">
                        /actuator/health
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                        <span className="text-slate-400 font-medium">Liveness Probe</span>
                        <span className="font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          {actuatorHealth?.status || "UP"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                        <span className="text-slate-400 font-medium">Readiness Probe</span>
                        <span className="font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          {actuatorHealth?.components?.readinessState?.status || "UP"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                        <span className="text-slate-400 font-medium">Graceful Shutdown</span>
                        <span className="font-mono text-cyan-400 font-semibold">
                          server.shutdown=graceful
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                      Targeted by AWS Route53 health checks &amp; ALB Target Groups to avoid dropping in-flight client requests.
                    </div>
                  </div>

                  {/* Tier 3 Database Specs */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
                      <Database className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-sm font-bold text-slate-200">Tier 3 · AWS RDS Database</h3>
                    </div>

                    <div className="space-y-2.5 text-xs font-mono">
                      <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800/60">
                        <span className="text-slate-500">Database Engine:</span>
                        <span className="text-slate-200">MySQL 8.0 / PG 16</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800/60">
                        <span className="text-slate-500">Schema Name:</span>
                        <span className="text-slate-200">adminportal</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800/60">
                        <span className="text-slate-500">JPA Schema Tool:</span>
                        <span className="text-slate-200">hibernate: update</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-slate-950/60 border border-slate-800/60">
                        <span className="text-slate-500">Password Hashing:</span>
                        <span className="text-slate-200">BCrypt (10 rounds)</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Standard Member Privileges Card */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-sm font-bold text-slate-200">Account Access Level</h3>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                        <span className="text-slate-400">Assigned Role</span>
                        <span className="font-mono text-cyan-300 font-semibold">{profile.role}</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                        <span className="text-slate-400">Admin Privileges</span>
                        <span className="font-mono text-amber-400 font-semibold">Disabled (Standard Member)</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                        <span className="text-slate-400">Session Security</span>
                        <span className="font-mono text-emerald-400 font-semibold">Active &amp; Verified</span>
                      </div>
                    </div>
                    <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">
                      Essential administrator controls and cluster management dashboards are restricted to System Administrators.
                    </p>
                  </div>

                  {/* Developer API References */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-sm font-bold text-slate-200">Developer API Endpoints</h3>
                    </div>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2 rounded bg-slate-950/60 border border-slate-800/60">
                        <span className="text-cyan-400 block font-semibold">GET /api/profile</span>
                        <span className="text-slate-400 text-[11px]">View personal account details</span>
                      </div>
                      <div className="p-2 rounded bg-slate-950/60 border border-slate-800/60">
                        <span className="text-cyan-400 block font-semibold">GET /api/user/workspace</span>
                        <span className="text-slate-400 text-[11px]">Fetch personal workspace and logs</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
