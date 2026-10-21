import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../api";
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Search,
  Filter,
  RefreshCw,
  Terminal,
  Bot,
  Send,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Database,
  Globe,
  Trash2,
  ArrowRight,
  Maximize2,
  Minimize2,
  ChevronRight,
  Check
} from "lucide-react";

export default function AuditLogs() {
  // Audit Logs State
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logError, setLogError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Log for detail or quick analysis
  const [selectedLog, setSelectedLog] = useState(null);

  // Gemini Chatbot State
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I am your **DevSecOps Intelligence Copilot** powered by `gemini-3.8-flash` with real-time **Google Search grounding**. I can help you investigate security alerts, review AWS ALB health, analyze brute-force incidents, or check Spring Security compliance. Select any audit log entry or ask me a question below.",
      timestamp: "Just now",
      grounded: true,
      sources: [
        { title: "AWS Security Documentation", url: "https://docs.aws.amazon.com/security/" },
        { title: "Spring Security Architecture", url: "https://docs.spring.io/spring-security/reference/" }
      ],
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatLoading]);

  // Fetch Audit Logs via REST API
  const fetchAuditLogs = useCallback(async () => {
    setLoadingLogs(true);
    setLogError("");
    try {
      const response = await api.get("/audit-logs", {
        params: {
          category: categoryFilter,
          severity: severityFilter,
          search: searchQuery,
        },
      });
      setLogs(response.data);
    } catch (err) {
      setLogError(err.response?.data?.message || "Failed to load audit logs from backend.");
    } finally {
      setLoadingLogs(false);
    }
  }, [categoryFilter, severityFilter, searchQuery]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Send message to Gemini AI Copilot
  const handleSendMessage = async (textToSend, logContext = null) => {
    const prompt = textToSend || chatInput;
    if (!prompt.trim() || chatLoading) return;

    const userMsg = {
      role: "user",
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await api.post("/ai/audit-chat", {
        messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
        selectedLog: logContext || selectedLog,
      });

      const assistantMsg = {
        role: "assistant",
        content: response.data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        grounded: response.data.grounded,
        sources: response.data.sources || [],
        searchQueries: response.data.searchQueries || [],
        model: response.data.model || "gemini-3.8-flash",
        quotaNotice: response.data.quotaNotice || null,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ Unable to query the AI Copilot. Please verify that the backend server is reachable and `GEMINI_API_KEY` is configured in your environment.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Quick triage from a specific log entry
  const handleAnalyzeLog = (log) => {
    setSelectedLog(log);
    const query = `Analyze security alert ${log.id} (${log.eventType}): what is the potential threat from IP ${log.ipAddress} targeting ${log.resource}, and what specific remediation actions should we take in Spring Boot and AWS?`;
    handleSendMessage(query, log);
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat session cleared. How can I assist with your DevOps and Security audit logs?",
        timestamp: "Just now",
      },
    ]);
    setSelectedLog(null);
  };

  // Metrics
  const criticalCount = logs.filter((l) => l.severity === "CRITICAL").length;
  const warnCount = logs.filter((l) => l.severity === "WARN").length;
  const infoCount = logs.filter((l) => l.severity === "INFO").length;

  return (
    <div className="space-y-6">
      {/* Top Telemetry KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Total Events Logged</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">{logs.length}</div>
          <div className="mt-1 text-[11px] text-slate-400">Recorded across Tier 2 / Tier 3</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Critical Alerts</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">{criticalCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Rate-limit &amp; Unauthorized Hits</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Warnings &amp; Elevated</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{warnCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Role changes &amp; Recovery tokens</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">AI Grounded Copilot</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1.5 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>gemini-3.8-flash</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1 font-mono">
            <Globe className="w-3 h-3 text-cyan-400" /> Google Search Grounded
          </div>
        </div>
      </div>

      {/* Main Split View: Audit Logs on Left / Gemini AI Copilot on Right */}
      <div className={`grid grid-cols-1 ${chatExpanded ? "lg:grid-cols-1" : "lg:grid-cols-12"} gap-6`}>
        {/* Left Column: Audit Logs Table (Hide when chat full-width expanded) */}
        {!chatExpanded && (
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-sm">
              {/* Header and Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-base font-bold text-slate-100">
                      System Event &amp; Security Audit Logs
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Immutable event ledger tracking auth attempts, role elevations, and AWS ALB health.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchAuditLogs}
                  disabled={loadingLogs}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Filters */}
              <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5">
                <div className="relative flex-1 w-full">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search logs by action, IP, user, details..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="py-1.5 px-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="SECURITY">Security Alerts</option>
                    <option value="SYSTEM">System Events</option>
                    <option value="ACCESS">Access &amp; Auth</option>
                    <option value="RDS">RDS Database</option>
                  </select>

                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="py-1.5 px-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                  >
                    <option value="ALL">All Severities</option>
                    <option value="CRITICAL">Critical Only</option>
                    <option value="WARN">Warnings Only</option>
                    <option value="INFO">Info Only</option>
                  </select>
                </div>
              </div>

              {/* Log List */}
              <div className="mt-4 space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                {loadingLogs && logs.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-slate-500">
                    <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-2" />
                    <span>Querying Tier 2 audit logging service...</span>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-slate-500">
                    No matching audit log records found.
                  </div>
                ) : (
                  logs.map((log) => {
                    const isCrit = log.severity === "CRITICAL";
                    const isWarn = log.severity === "WARN";

                    return (
                      <div
                        key={log.id}
                        className={`p-3.5 rounded-lg border transition-all text-xs font-mono ${
                          selectedLog?.id === log.id
                            ? "bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-950/30"
                            : isCrit
                            ? "bg-rose-950/20 border-rose-900/50 hover:border-rose-700/70"
                            : isWarn
                            ? "bg-amber-950/20 border-amber-900/50 hover:border-amber-700/70"
                            : "bg-slate-950/70 border-slate-800/80 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                isCrit
                                  ? "bg-rose-950 text-rose-300 border-rose-800"
                                  : isWarn
                                  ? "bg-amber-950 text-amber-300 border-amber-800"
                                  : "bg-cyan-950 text-cyan-300 border-cyan-800"
                              }`}
                            >
                              {log.severity}
                            </span>
                            <span className="text-slate-400 font-bold">{log.id}</span>
                            <span className="text-slate-500 text-[11px]">
                              {new Date(log.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </span>
                          </div>

                          {/* Quick AI Analyze Button */}
                          <button
                            type="button"
                            onClick={() => handleAnalyzeLog(log)}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 hover:border-cyan-600 transition-colors text-[11px] cursor-pointer"
                            title="Triage this incident with Gemini AI"
                          >
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            <span>Analyze with AI</span>
                          </button>
                        </div>

                        <div className="mt-2 text-slate-200 font-sans font-semibold text-xs">
                          {log.action}
                        </div>

                        <div className="mt-1 text-[11px] text-slate-400 leading-relaxed font-sans">
                          {log.details}
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-800/70 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                          <div className="flex items-center gap-3">
                            <span>Actor: <strong className="text-slate-300 font-mono">@{log.user}</strong></span>
                            <span>IP: <code className="text-slate-300">{log.ipAddress}</code></span>
                          </div>
                          <span>Target: <code className="text-cyan-400">{log.resource}</code></span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Gemini Chatbot Copilot */}
        <div className={chatExpanded ? "lg:col-span-12" : "lg:col-span-5"}>
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-2xl flex flex-col h-[700px] overflow-hidden backdrop-blur-sm">
            {/* Copilot Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-950 to-blue-900 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      <span>DevOps Security Copilot</span>
                    </h3>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                      gemini-3.8-flash
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-cyan-400" />
                    <span>Search Grounding Enabled</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Clear chat history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setChatExpanded(!chatExpanded)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer hidden lg:block"
                  title={chatExpanded ? "Contract panel" : "Expand to full width"}
                >
                  {chatExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Selected Log Context Pill if active */}
            {selectedLog && (
              <div className="px-4 py-2 bg-cyan-950/50 border-b border-cyan-800/40 text-[11px] font-mono flex items-center justify-between text-cyan-300">
                <div className="flex items-center gap-1.5 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Inspecting Log: <strong className="text-white">{selectedLog.id}</strong> ({selectedLog.eventType})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="text-cyan-400 hover:text-cyan-200 underline cursor-pointer ml-2"
                >
                  Clear context
                </button>
              </div>
            )}

            {/* Chat Thread Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
              {messages.map((msg, index) => {
                const isAssistant = msg.role === "assistant";

                return (
                  <div
                    key={index}
                    className={`flex items-start gap-2.5 ${
                      isAssistant ? "justify-start" : "justify-end"
                    }`}
                  >
                    {isAssistant && (
                      <div className="w-7 h-7 rounded-md bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-xl p-3.5 leading-relaxed shadow-sm ${
                        isAssistant
                          ? "bg-slate-950 border border-slate-800 text-slate-200"
                          : "bg-cyan-600 text-white font-medium"
                      }`}
                    >
                      {/* Message Content */}
                      <div className="whitespace-pre-wrap space-y-2">
                        {msg.content}
                      </div>

                      {/* Google Search Grounding Sources */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                          <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 mb-1.5">
                            <Globe className="w-3 h-3" />
                            <span>Google Search Grounded References:</span>
                          </div>
                          <div className="space-y-1">
                            {msg.sources.map((src, sIdx) => (
                              <a
                                key={sIdx}
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 font-mono underline truncate transition-colors"
                              >
                                <ExternalLink className="w-3 h-3 shrink-0" />
                                <span className="truncate">{src.title}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Quota safeguard callout if 429 triggered */}
                      {msg.quotaNotice && (
                        <div className="mt-2.5 p-2 rounded-md bg-amber-950/40 border border-amber-850/60 text-[11px] font-mono text-amber-300 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{msg.quotaNotice}</span>
                        </div>
                      )}

                      <div className="mt-2 text-[10px] text-slate-500 font-mono text-right">
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                );
              })}

              {chatLoading && (
                <div className="flex items-center gap-2.5 text-xs text-slate-400 font-mono">
                  <div className="w-7 h-7 rounded-md bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Gemini is researching incident telemetry &amp; live advisories...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Prompt Chips */}
            <div className="p-2.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono text-slate-400">
              <span className="text-slate-500 shrink-0">Quick prompts:</span>
              <button
                type="button"
                onClick={() =>
                  handleSendMessage("Analyze brute-force alert LOG-9079 and provide Spring Boot mitigation")
                }
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 shrink-0 transition-colors cursor-pointer"
              >
                Triage Brute-Force LOG-9079
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSendMessage("Check current AWS ALB health probe requirements for Spring Boot Actuator")
                }
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 shrink-0 transition-colors cursor-pointer"
              >
                AWS ALB Health Checks
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSendMessage("Search recent Spring Boot 3 & Spring Security CVEs and verify our posture")
                }
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 shrink-0 transition-colors cursor-pointer"
              >
                Search Spring CVEs
              </button>
            </div>

            {/* Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask Gemini Security Copilot about logs, threats, or CVEs..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
                className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="p-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0 shadow-md shadow-cyan-950/40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
