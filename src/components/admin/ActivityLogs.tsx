import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, deleteDoc, doc, limit } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { AdminActivityLog } from "./AdminTypes";
import { FileText, Search, Trash2, ShieldAlert, Calendar, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

interface ActivityLogsProps {
  currentUser: any;
  formatDate: (val: any) => string;
}

export default function ActivityLogs({ currentUser, formatDate }: ActivityLogsProps) {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "activity_logs"), orderBy("timestamp", "desc"), limit(200));
      const snap = await getDocs(q);
      const list: AdminActivityLog[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as AdminActivityLog);
      });
      setLogs(list);
    } catch (e) {
      console.error("Error loading activity logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDeleteLog = async (logId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this log? This action is irreversible.")) {
      return;
    }
    try {
      await deleteDoc(doc(db, "activity_logs", logId));
      setLogs((prev) => prev.filter((l) => l.id !== logId));
    } catch (e) {
      alert("Failed to delete log: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      (log.userEmail || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.action || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.target || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterAction === "all" || log.action.includes(filterAction);

    return matchesSearch && matchesFilter;
  });

  // Extract unique actions for filters
  const uniqueActions = Array.from(new Set(logs.map((l) => l.action.split("_")[0])));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="text-amber-500" size={22} />
            Security & Activity Logs
          </h2>
          <p className="text-sm text-slate-400">
            Real-time auditable platform events. These logs are immutable.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs font-semibold text-white hover:bg-white/[0.1] active:scale-95 transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Logs
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/40 p-4 rounded-2xl border border-white/[0.05]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search by user email, action, details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        <div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
          >
            <option value="all">All Action Categories</option>
            <option value="payment">Direct Payment Actions</option>
            <option value="lead">Lead Actions</option>
            <option value="company">Company Actions</option>
            <option value="subscription">Subscription Actions</option>
            <option value="settings">Settings Changes</option>
            <option value="admin">Admin Overrides</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-xs text-slate-400 font-mono">
          Showing {filteredLogs.length} of {logs.length} logged actions
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/20 border border-white/[0.05] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400">
            <RefreshCw size={24} className="animate-spin mx-auto mb-4 text-amber-500" />
            Loading system events...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            <FileText size={40} className="mx-auto mb-4 text-slate-600" />
            <p className="font-bold text-white mb-1">No Activity Logs Found</p>
            <p className="text-xs text-slate-500">No database log entries match the active filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.02] text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Operator</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target / Entity</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.01] transition-colors text-slate-300">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">{log.userEmail || "System"}</div>
                      <div className="text-xs text-slate-500 font-mono">{log.userUid || "system"}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium ${
                        log.action.includes("admin") ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        log.action.includes("subscription") ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                        log.action.includes("payment") || log.action.includes("wallet") ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs max-w-[150px] truncate">
                      {log.target || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-xs max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-500" />
                        {formatDate(log.timestamp)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                        title="Delete log permanently"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
