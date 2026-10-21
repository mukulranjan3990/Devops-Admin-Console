import React, { useState, useEffect, useCallback } from "react";
import api from "../api";
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Building2,
  Mail,
  UserCheck,
  Lock,
  ChevronDown,
  Info,
  Eye,
  EyeOff,
  Key,
  Copy,
  CheckCircle2
} from "lucide-react";

const AVAILABLE_ROLES = [
  {
    id: "ADMIN",
    label: "Admin",
    badgeClass: "bg-rose-950/70 text-rose-300 border-rose-800/60",
    description: "Full cluster management, RDS database controls, and user administration.",
  },
  {
    id: "DEVOPS_ENGINEER",
    label: "DevOps Engineer",
    badgeClass: "bg-cyan-950/70 text-cyan-300 border-cyan-800/60",
    description: "CI/CD execution, ALB target group configuration, and container deployments.",
  },
  {
    id: "SECURITY_AUDITOR",
    label: "Security Auditor",
    badgeClass: "bg-amber-950/70 text-amber-300 border-amber-800/60",
    description: "SOC2 compliance inspection, token auditing, and read-only telemetry.",
  },
  {
    id: "VIEWER",
    label: "Viewer",
    badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
    description: "Read-only access to dashboard metrics and actuator health probes.",
  },
];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Edit / Role Assignment Modal state
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    role: "VIEWER",
    department: "",
    newPassword: "",
  });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  // Create User Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: "",
    fullName: "",
    email: "",
    role: "DEVOPS_ENGINEER",
    department: "Cloud & DevOps Engineering",
    password: "",
  });
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState("");

  // Post-creation credentials receipt modal (so admin can copy and provide to user)
  const [createdUserReceipt, setCreatedUserReceipt] = useState(null);
  const [copied, setCopied] = useState(false);

  // Quick reset password modal
  const [resettingUser, setResettingUser] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetSaving, setResetSaving] = useState(false);
  const [resetError, setResetError] = useState("");

  // Delete confirmation
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  // Helper: Generate strong random password
  const generateRandomPassword = () => {
    const charset = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return pass;
  };

  // Fetch users via REST API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to retrieve registered users from database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Open Edit Modal
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      fullName: user.fullName || "",
      email: user.email || "",
      role: user.role || "VIEWER",
      department: user.department || "",
      newPassword: "",
    });
    setShowEditPassword(false);
    setEditError("");
  };

  // Submit Edit Form (PUT /api/users/:id)
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editForm.email || !editForm.email.includes("@")) {
      setEditError("A valid email address is required.");
      return;
    }

    if (editForm.newPassword && editForm.newPassword.trim().length < 6) {
      setEditError("Password must be at least 6 characters if updating.");
      return;
    }

    setEditSaving(true);
    setEditError("");

    try {
      const payload = {
        fullName: editForm.fullName,
        email: editForm.email,
        role: editForm.role,
        department: editForm.department,
      };

      if (editForm.newPassword && editForm.newPassword.trim()) {
        payload.password = editForm.newPassword.trim();
      }

      const response = await api.put(`/users/${editingUser.id}`, payload);

      // Update state in-place
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...response.data } : u))
      );
      setEditingUser(null);
      setSuccessNotice(`User @${editingUser.username} updated in database.`);
      setTimeout(() => setSuccessNotice(""), 4000);
    } catch (err) {
      setEditError(err.response?.data?.message || "Failed to update user.");
    } finally {
      setEditSaving(false);
    }
  };

  // Submit Create Form (POST /api/users)
  const handleSaveCreate = async (e) => {
    e.preventDefault();
    const cleanUser = createForm.username.trim();
    const cleanEmail = createForm.email.trim();
    const cleanPassword = createForm.password.trim();

    if (!cleanUser || !cleanEmail || !createForm.role) {
      setCreateError("Username, valid email, and role are required.");
      return;
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      setCreateError("Initial password is required and must be at least 6 characters.");
      return;
    }

    setCreateSaving(true);
    setCreateError("");

    try {
      const response = await api.post("/users", {
        username: cleanUser,
        fullName: createForm.fullName.trim() || cleanUser,
        email: cleanEmail,
        role: createForm.role,
        department: createForm.department.trim(),
        password: cleanPassword,
      });

      setUsers((prev) => [...prev, response.data]);
      setIsCreateOpen(false);

      // Open credentials receipt modal so admin can copy and provide to user
      setCreatedUserReceipt({
        username: response.data.username,
        fullName: response.data.fullName,
        email: response.data.email,
        role: response.data.role,
        department: response.data.department,
        password: cleanPassword,
      });

      setCreateForm({
        username: "",
        fullName: "",
        email: "",
        role: "DEVOPS_ENGINEER",
        department: "Cloud & DevOps Engineering",
        password: "",
      });

      setSuccessNotice(`New user @${response.data.username} successfully registered in database.`);
      setTimeout(() => setSuccessNotice(""), 4000);
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to register new user.");
    } finally {
      setCreateSaving(false);
    }
  };

  // Copy credentials helper
  const handleCopyCredentials = () => {
    if (!createdUserReceipt) return;
    const credText = `DevOps Portal Credentials:\nUsername: ${createdUserReceipt.username}\nPassword: ${createdUserReceipt.password}\nRole: ${createdUserReceipt.role}\nEmail: ${createdUserReceipt.email}`;
    navigator.clipboard.writeText(credText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Open quick reset password modal
  const handleOpenResetPassword = (user) => {
    setResettingUser(user);
    setResetPasswordValue(generateRandomPassword());
    setResetError("");
  };

  // Confirm and Execute Reset Password
  const handleConfirmResetPassword = async () => {
    if (!resettingUser || !resetPasswordValue) return;

    if (resetPasswordValue.trim().length < 6) {
      setResetError("New password must be at least 6 characters.");
      return;
    }

    setResetSaving(true);
    setResetError("");

    try {
      await api.post(`/users/${resettingUser.id}/reset-password`, {
        newPassword: resetPasswordValue.trim(),
      });

      setSuccessNotice(`Password updated for user @${resettingUser.username}. Provide new password to them.`);
      
      // Also open receipt for easy copying
      setCreatedUserReceipt({
        username: resettingUser.username,
        fullName: resettingUser.fullName,
        email: resettingUser.email,
        role: resettingUser.role,
        department: resettingUser.department,
        password: resetPasswordValue.trim(),
      });

      setResettingUser(null);
      setTimeout(() => setSuccessNotice(""), 4000);
    } catch (err) {
      setResetError(err.response?.data?.message || "Failed to update user password.");
    } finally {
      setResetSaving(false);
    }
  };

  // Confirm and Execute Delete (DELETE /api/users/:id)
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setDeleteSaving(true);
    try {
      await api.delete(`/users/${userToDelete.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setSuccessNotice(`User @${userToDelete.username} deleted from database.`);
      setUserToDelete(null);
      setTimeout(() => setSuccessNotice(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user.");
    } finally {
      setDeleteSaving(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      {successNotice && (
        <div
          role="status"
          className="p-3.5 bg-emerald-950/60 border border-emerald-800 rounded-lg text-emerald-200 text-xs flex items-center justify-between animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono">{successNotice}</span>
          </div>
          <button
            onClick={() => setSuccessNotice("")}
            className="text-emerald-400 hover:text-emerald-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="p-3.5 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-200 text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header and Controls */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-bold text-slate-100">
                Registered Users &amp; Role Management
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
                {users.length} Active Accounts
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Administer registered database accounts, assign RBAC permissions, and manage user login credentials.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              type="button"
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Refresh users list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(true);
                setCreateForm((prev) => ({
                  ...prev,
                  password: generateRandomPassword(),
                }));
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors shadow-sm shadow-cyan-950/40 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add New User</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, username, email, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="py-2 px-3 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="ALL">All Roles ({users.length})</option>
              <option value="ADMIN">ADMIN</option>
              <option value="DEVOPS_ENGINEER">DEVOPS_ENGINEER</option>
              <option value="SECURITY_AUDITOR">SECURITY_AUDITOR</option>
              <option value="VIEWER">VIEWER</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono tracking-wider text-[11px]">
                <th className="py-3 px-3">User</th>
                <th className="py-3 px-3">Email Address</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Assigned Role</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                      <span>Loading registered users from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No users match the search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleConfig =
                    AVAILABLE_ROLES.find((r) => r.id === user.role) || AVAILABLE_ROLES[3];
                  const isRootAdmin = user.username === "admin";

                  return (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Name & Username */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-400">
                            {user.username?.slice(0, 2).toUpperCase() || "US"}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200 font-sans text-xs">
                              {user.fullName || user.username}
                            </div>
                            <div className="text-[11px] text-cyan-400 flex items-center gap-1">
                              <span>@{user.username}</span>
                              {isRootAdmin && (
                                <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                  Primary Root
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-3 text-slate-300">
                        <span className="truncate max-w-[200px] block">{user.email}</span>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-3 text-slate-400 font-sans text-xs">
                        {user.department || "Engineering"}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border font-semibold ${roleConfig.badgeClass}`}
                        >
                          <Shield className="w-3 h-3 shrink-0" />
                          <span>{user.role}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenResetPassword(user)}
                            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors cursor-pointer"
                            title="Reset / Set user password"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                            title="Edit user & assign role"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={isRootAdmin}
                            onClick={() => setUserToDelete(user)}
                            className={`p-1.5 rounded-md transition-colors ${
                              isRootAdmin
                                ? "opacity-30 cursor-not-allowed text-slate-600"
                                : "bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 cursor-pointer"
                            }`}
                            title={isRootAdmin ? "Cannot delete root admin" : "Delete user"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT & ROLE ASSIGNMENT MODAL */}
      {editingUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="absolute top-5 right-5 text-slate-500 hover:text-slate-300 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-100">
                Edit User &amp; Assign Role
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Updating account attributes and RBAC level for <span className="text-cyan-300 font-mono">@{editingUser.username}</span>.
            </p>

            {editError && (
              <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Password update option */}
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Change Password (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditForm((prev) => ({ ...prev, newPassword: generateRandomPassword() }))}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono underline cursor-pointer"
                  >
                    Generate Password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    placeholder="Leave blank to keep current password, or enter min 6 characters"
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                    className="w-full pl-3 pr-10 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Update this field only if the user needs their access credentials reset.
                </p>
              </div>

              {/* Role Assignment Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Assign Role (RBAC)
                  </label>
                  {editingUser.username === "admin" && (
                    <span className="text-[11px] text-amber-400 font-mono flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Root Admin Locked
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {AVAILABLE_ROLES.map((role) => {
                    const isSelected = editForm.role === role.id;
                    const isDisabled = editingUser.username === "admin" && role.id !== "ADMIN";

                    return (
                      <label
                        key={role.id}
                        className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                          isDisabled
                            ? "opacity-40 cursor-not-allowed bg-slate-950/40 border-slate-800"
                            : isSelected
                            ? "bg-cyan-950/50 border-cyan-500/60 shadow-sm"
                            : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="role-select"
                          value={role.id}
                          disabled={isDisabled}
                          checked={isSelected}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          className="mt-0.5 text-cyan-500 focus:ring-cyan-400"
                        />
                        <div className="flex-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">{role.label}</span>
                            <span className="font-mono text-[10px] text-slate-400">({role.id})</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            {role.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={editSaving}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors shadow-sm shadow-cyan-950/50 cursor-pointer"
                >
                  {editSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Update User</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW USER MODAL (With Password Field) */}
      {isCreateOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-5 right-5 text-slate-500 hover:text-slate-300 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <UserPlus className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-100">
                Register New User Account
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Add a new user record to the persistent database and set their initial login password.
            </p>

            {createError && (
              <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Username <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. jdoe"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Full Name <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Email Address <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="jdoe@devopsportal.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Password Input Field with Generator */}
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    User Password <span className="text-cyan-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCreateForm((prev) => ({ ...prev, password: generateRandomPassword() }))}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono underline cursor-pointer"
                  >
                    Generate Strong Password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showCreatePassword ? "text" : "password"}
                    required
                    placeholder="Enter user's initial password (min 6 chars)"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full pl-3 pr-10 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showCreatePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Provide this password to the new user so they can log in. You will receive a summary to copy after saving.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={createForm.department}
                  onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Assign Initial Role
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                >
                  <option value="ADMIN">ADMIN (Full Superadmin)</option>
                  <option value="DEVOPS_ENGINEER">DEVOPS_ENGINEER (Deployment &amp; Health)</option>
                  <option value="SECURITY_AUDITOR">SECURITY_AUDITOR (Compliance &amp; Logs)</option>
                  <option value="VIEWER">VIEWER (Read-Only Monitoring)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={createSaving}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors shadow-sm shadow-cyan-950/50 cursor-pointer"
                >
                  {createSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating User...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register User</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER CREDENTIALS PROVISIONED RECEIPT (To provide to user) */}
      {createdUserReceipt && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-md bg-slate-900 border border-cyan-800/80 rounded-xl shadow-2xl p-6 text-slate-100 space-y-4">
            <button
              type="button"
              onClick={() => setCreatedUserReceipt(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-emerald-400">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-slate-100">User Credentials Provisioned</h3>
                <p className="text-xs text-slate-400">Account maintained in database. Provide these credentials to the user.</p>
              </div>
            </div>

            <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-500">Username:</span>
                <span className="text-cyan-300 font-bold select-all">@{createdUserReceipt.username}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-500">Password:</span>
                <span className="text-emerald-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-emerald-900/50 select-all">
                  {createdUserReceipt.password}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-500">Role:</span>
                <span className="text-slate-200">{createdUserReceipt.role}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-300 truncate max-w-[200px]">{createdUserReceipt.email}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              The user can now sign in immediately using these credentials from the portal login page.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="flex-1 py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-cyan-950/40"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Credentials Copied to Clipboard!" : "Copy User Credentials"}</span>
              </button>
              <button
                type="button"
                onClick={() => setCreatedUserReceipt(null)}
                className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK RESET PASSWORD MODAL */}
      {resettingUser && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-slate-100 space-y-4">
            <button
              type="button"
              onClick={() => setResettingUser(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-cyan-400">
              <Key className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-slate-100">Set User Password</h3>
            </div>
            <p className="text-xs text-slate-400">
              Provide a new password for <strong className="text-cyan-300 font-mono">@{resettingUser.username}</strong> ({resettingUser.fullName}).
            </p>

            {resetError && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-800 rounded-lg text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  New Password
                </label>
                <button
                  type="button"
                  onClick={() => setResetPasswordValue(generateRandomPassword())}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono underline cursor-pointer"
                >
                  Generate Strong
                </button>
              </div>
              <input
                type="text"
                placeholder="Min 6 characters"
                value={resetPasswordValue}
                onChange={(e) => setResetPasswordValue(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResettingUser(null)}
                disabled={resetSaving}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPassword}
                disabled={resetSaving || !resetPasswordValue || resetPasswordValue.length < 6}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-medium cursor-pointer"
              >
                {resetSaving ? "Saving..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {userToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-slate-100">Delete User Account</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete user <strong className="text-white font-mono">@{userToDelete.username}</strong> ({userToDelete.fullName}) from the database? This action is irreversible.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deleteSaving}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteSaving}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium cursor-pointer"
              >
                {deleteSaving ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
