import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { AdminActivityLog } from "./AdminTypes";
import { 
  Building2, Users, Coins, Sparkles, Award, ClipboardList, ShieldAlert, 
  ArrowRight, Calendar, Activity, Home, RefreshCw, Layers
} from "lucide-react";

interface AdminDashboardProps {
  currentUser: any;
  formatCurrency: (val: number) => string;
  formatDate: (val: any) => string;
  onNavigate: (tab: "dashboard" | "users") => void;
}

export default function AdminDashboard({ currentUser, formatCurrency, formatDate, onNavigate }: AdminDashboardProps) {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalProperties: 0,
    totalLeads: 0,
    activeSubs: 0,
    expiredSubs: 0,
    monthlyRevenue: 0,
  });
  const [recentLogs, setRecentLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [usersSnap, companiesSnap, unitsSnap, leadsSnap, txSnap, logsSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "companies")),
        getDocs(collection(db, "units")),
        getDocs(collection(db, "leads")),
        getDocs(collection(db, "transactions")),
        getDocs(query(collection(db, "activity_logs"), orderBy("timestamp", "desc"), limit(5)))
      ]);

      // Calculate Revenue (Sum of all charges)
      let rev = 0;
      txSnap.forEach((doc) => {
        const d = doc.data();
        if (d.type === "charge" || d.type === "debit") {
          rev += d.amount || 0;
        }
      });

      // Calculate Subscriptions
      let active = 0;
      let expired = 0;
      usersSnap.forEach((doc) => {
        const u = doc.data();
        if (u.isPremium || u.role === "admin" || u.subscription?.status === "active") {
          active++;
        } else if (u.subscription?.status === "cancelled" || u.subscription?.status === "paused") {
          expired++;
        }
      });

      // Map logs
      const logs: AdminActivityLog[] = [];
      logsSnap.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() } as AdminActivityLog);
      });

      setMetrics({
        totalUsers: usersSnap.size,
        totalCompanies: companiesSnap.size,
        totalProperties: unitsSnap.size,
        totalLeads: leadsSnap.size,
        activeSubs: active,
        expiredSubs: expired,
        monthlyRevenue: rev,
      });
      setRecentLogs(logs);

    } catch (e) {
      console.error("Failed to load admin dashboard telemetry:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-slate-400">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto mb-4"></div>
        Aggregating system statistics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/35 p-6 rounded-2xl border border-white/[0.05]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="text-amber-500" size={22} />
            Super Admin Control Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <span className="text-white font-semibold">{currentUser?.email}</span>. Live connection is established.
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs font-semibold text-white hover:bg-white/[0.1] active:scale-95 transition-all cursor-pointer"
        >
          <RefreshCw size={14} className="text-amber-500" />
          Refresh Core Metrics
        </button>
      </div>

      {/* Numerical Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Users */}
        <button 
          onClick={() => onNavigate("users")}
          className="bg-slate-900/30 hover:bg-slate-900/40 p-5 rounded-2xl border border-white/[0.05] text-left transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Users</span>
            <Users className="text-blue-500" size={18} />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{metrics.totalUsers}</div>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            Active in Auth Directory <ArrowRight size={10} />
          </p>
        </button>

        {/* Metric 2: Companies */}
        <button 
          onClick={() => onNavigate("users")}
          className="bg-slate-900/30 hover:bg-slate-900/40 p-5 rounded-2xl border border-white/[0.05] text-left transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Companies</span>
            <Building2 className="text-purple-500" size={18} />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{metrics.totalCompanies}</div>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            Registered brokerages <ArrowRight size={10} />
          </p>
        </button>

        {/* Metric 3: Properties */}
        <button 
          onClick={() => onNavigate("users")}
          className="bg-slate-900/30 hover:bg-slate-900/40 p-5 rounded-2xl border border-white/[0.05] text-left transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Properties</span>
            <Home className="text-emerald-500" size={18} />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{metrics.totalProperties}</div>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            Active property listings <ArrowRight size={10} />
          </p>
        </button>

        {/* Metric 4: Leads */}
        <button 
          onClick={() => onNavigate("users")}
          className="bg-slate-900/30 hover:bg-slate-900/40 p-5 rounded-2xl border border-white/[0.05] text-left transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Leads</span>
            <Sparkles className="text-amber-500" size={18} />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{metrics.totalLeads}</div>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            Pipeline lead assets <ArrowRight size={10} />
          </p>
        </button>

        {/* Metric 5: Active Subs */}
        <button 
          onClick={() => onNavigate("users")}
          className="bg-slate-900/30 hover:bg-slate-900/40 p-5 rounded-2xl border border-white/[0.05] text-left transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Subs</span>
            <Award className="text-purple-400" size={18} />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{metrics.activeSubs}</div>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            Licensed premium seats <ArrowRight size={10} />
          </p>
        </button>

        {/* Metric 6: Expired Subs */}
        <button 
          onClick={() => onNavigate("users")}
          className="bg-slate-900/30 hover:bg-slate-900/40 p-5 rounded-2xl border border-white/[0.05] text-left transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Inactive Subs</span>
            <Layers className="text-slate-400" size={18} />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{metrics.expiredSubs}</div>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            Paused or cancelled <ArrowRight size={10} />
          </p>
        </button>

        {/* Metric 7: Revenue */}
        <button 
          onClick={() => onNavigate("users")}
          className="bg-slate-900/30 hover:bg-slate-900/40 p-5 rounded-2xl border border-white/[0.05] text-left transition-all hover:-translate-y-0.5 md:col-span-2 cursor-pointer"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Turnover Revenue (EGP)</span>
            <Coins className="text-amber-500" size={18} />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{formatCurrency(metrics.monthlyRevenue)}</div>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            Processed payments ledger <ArrowRight size={10} />
          </p>
        </button>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-slate-900/20 p-6 rounded-2xl border border-white/[0.05] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 uppercase tracking-wider text-slate-300">
            <Activity className="text-amber-500" size={16} />
            Recent Administrative Actions
          </h3>
          <button 
            onClick={() => onNavigate("users")}
            className="text-xs text-amber-400 font-bold hover:underline cursor-pointer"
          >
            Brokers Directory
          </button>
        </div>

        {recentLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 font-mono">
            No activity logs written to database yet.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03] space-y-3">
            {recentLogs.map((log) => (
              <div key={log.id} className="pt-3 flex justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-white">
                    {log.userEmail} <span className="text-[10px] text-slate-500 font-normal">({log.action})</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{log.details}</p>
                </div>
                <div className="text-[10px] text-slate-500 whitespace-nowrap text-right font-mono">
                  {formatDate(log.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
