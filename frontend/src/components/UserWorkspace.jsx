import React, { useState, useEffect, useCallback } from "react";
import api from "../api";
import {
  Shield,
  ShieldAlert,
  User,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Database,
  Lock,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Mail,
  Building2,
  Calendar,
  Key
} from "lucide-react";

/**
 * UserWorkspace Component
 * Specialized, secure workspace rendered when a normal (non-admin) user logs in.
 * Standard users do NOT have access to the essential admin dashboard, cluster connection pool leases,
 * server health actuator internals, or user management tools.
 */
export default function UserWorkspace({ userProfile, onSwitchToProfile }) {
  const [workspaceData, setWorkspaceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedToken, setCopiedToken] = useState(false);

  const fetchWorkspaceData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/user/workspace");
      setWorkspaceData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load personal workspace data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  const currentToken = localStorage.getItem("jwt_token") || "";

  const handleCopyToken = () => {
    if (!currentToken) return;
    navigator.clipboard.writeText(currentToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "N/A";
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  const user = workspaceData?.user || userProfile || {};
  const personalLogs = workspaceData?.recentActivities || [];

  return (
    <div className="space-y-6">
      {/* Informative Security Notice Banner */}
      <div className="p-4 bg-slate-900/90 border border-amber-500/30 rounded-xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-sm">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Normal User Access Control
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
                ROLE: {user.role || "USER"}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              You are signed in with standard member permissions. The essential administrator dashboard, database cluster telemetry, and user management are strictly restricted to System Administrators.
            </p>
          </div>
        </div>
        <button
          onClick={fetchWorkspaceData}
          disabled={loading}
          className="self-end sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Workspace</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-950/50 border border-rose-800 rounded-lg text-rose-200 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary User Identity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-xl font-mono shadow-inner">
                {user.username?.slice(0, 2).toUpperCase() || "US"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-100">{user.fullName || "Member"}</h2>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
                    Active
                  </span>
                </div>
                <p className="font-mono text-xs text-cyan-400">@{user.username}</p>
                <p className="text-xs text-slate-400 mt-0.5">{user.department || "DevOps Engineering"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={onSwitchToProfile}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span>Change Password</span>
              </button>
              <button
                onClick={onSwitchToProfile}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 text-xs font-medium transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>View Full Profile</span>
              </button>
            </div>
          </div>

          {/* User Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/70">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                Email Address
              </span>
              <p className="font-mono text-slate-200 truncate">{user.email || "N/A"}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/70">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                Department
              </span>
              <p className="text-slate-200 truncate">{user.department || "Standard Team"}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/70">
              <span className="text-slate-400 flex items-center gap-1.5 mb-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                Account Created
              </span>
              <p className="font-mono text-slate-300">{formatDate(user.createdAt)}</p>
            </div>
          </div>

          {/* Role-Based Permissions Summary */}
          <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-cyan-400" />
                Access Privileges Matrix
              </span>
              <span className="text-[11px] font-mono text-slate-400">RBAC Enforced</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-2 p-3 rounded bg-emerald-950/20 border border-emerald-900/40">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Granted Privileges
                </span>
                <ul className="space-y-1.5 text-slate-300 text-[11px]">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Personal Profile &amp; Account Details</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>JWT Bearer Token Session Management</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Developer REST API Access &amp; Documentation</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>High-Level Platform Service Availability</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2 p-3 rounded bg-rose-950/20 border border-rose-900/40">
                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
                  Restricted (Admin Only)
                </span>
                <ul className="space-y-1.5 text-slate-400 text-[11px]">
                  <li className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Essential Admin Dashboard &amp; Cluster Telemetry</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>User Management (Create, Edit, Delete Accounts)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>AWS RDS MySQL Connection Pool Internals</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>System-Wide Security Audit Trails &amp; Copilot</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Status Overview Card */}
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-200">Platform Availability</h3>
              </div>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                All Systems Normal
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">Web Frontend</span>
                <span className="font-mono text-emerald-400 flex items-center gap-1.5 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Operational
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">REST API Gateway</span>
                <span className="font-mono text-emerald-400 flex items-center gap-1.5 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Active (Spring Boot)
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">Database Engine</span>
                <span className="font-mono text-emerald-400 flex items-center gap-1.5 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Online
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400">Authentication</span>
                <span className="font-mono text-cyan-400 font-semibold">
                  JWT HMAC-SHA256
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-800/80">
              Platform status is continuously monitored by automated health probes. Administrative telemetry is restricted.
            </p>
          </div>

          {/* Quick Developer Endpoints */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-200">Developer Endpoints</h3>
              </div>
              <button
                onClick={handleCopyToken}
                className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-200 cursor-pointer"
              >
                {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedToken ? "Copied" : "Copy Token"}</span>
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-950/70 border border-slate-800/80">
                <span className="text-cyan-400 block font-semibold">GET /api/profile</span>
                <span className="text-slate-500 text-[10px]">Fetch current user details</span>
              </div>

              <div className="p-2 rounded bg-slate-950/70 border border-slate-800/80">
                <span className="text-cyan-400 block font-semibold">GET /api/user/workspace</span>
                <span className="text-slate-500 text-[10px]">Retrieve user workspace &amp; logs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Activity History (Isolated to current user only) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>My Account Activity Stream</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Personal authentication events and session activity recorded for @{user.username}.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {personalLogs.length} Events
          </span>
        </div>

        {personalLogs.length === 0 ? (
          <div className="text-center py-8 text-xs font-mono text-slate-500">
            No recent activity recorded for this account yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {personalLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:bg-slate-800/20 px-2 rounded-lg transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                    log.status === "SUCCESS" ? "bg-emerald-400" : "bg-amber-400"
                  }`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-200">{log.action}</span>
                      <span className="font-mono text-[11px] text-cyan-400">@{log.user}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {log.details || `Action recorded on ${log.resource || "system"}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs text-slate-500 self-end sm:self-auto">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{log.timestamp ? formatDate(log.timestamp) : "Recent"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
