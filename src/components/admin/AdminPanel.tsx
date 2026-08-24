import React, { useState } from "react";
import { 
  Users, ClipboardList, ShieldAlert, LogOut, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Unit, Lead, RefundRequest } from "../../types";

// Sub-components
import AdminDashboard from "./AdminDashboard";
import UserManagement from "./UserManagement";

interface AdminPanelProps {
  currentUser: any;
  onClose: () => void;
  units?: Unit[];
  leads?: Lead[];
  refunds?: RefundRequest[];
  onAddUnit?: (unit: Omit<Unit, "id" | "createdAt">) => Promise<void>;
  onUpdateUnit?: (unitId: string, updatedFields: Partial<Omit<Unit, "id" | "createdAt font-bold">>) => Promise<void>;
  onDeleteUnit?: (unitId: string) => Promise<void>;
  onAddLead?: (lead: Omit<Lead, "id" | "createdAt">) => Promise<void>;
  onClaimLead?: (leadId: string, value: number) => Promise<void>;
  onRequestRefund?: (leadId: string, leadName: string, reason: string, amount: number) => Promise<void>;
  onClearAllLeads?: () => Promise<void>;
  onClearAllData?: () => Promise<void>;
}

type TabType = "dashboard" | "users";

export default function AdminPanel({
  currentUser,
  onClose,
  units = [],
  leads = [],
  refunds = [],
  onAddUnit,
  onUpdateUnit,
  onDeleteUnit,
  onAddLead,
  onClaimLead,
  onRequestRefund,
  onClearAllLeads,
  onClearAllData
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  // STRICT ACCESS RESTRICTION: Platform Super Admin ONLY
  const isSuperAdmin = currentUser?.email?.toLowerCase() === "brokera284@gmail.com";

  // Formatter utilities
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatDate = (val: any) => {
    if (!val) return "N/A";
    let date: Date;
    if (val.seconds) {
      date = new Date(val.seconds * 1000);
    } else if (typeof val.toDate === "function") {
      date = val.toDate();
    } else if (val instanceof Date) {
      date = val;
    } else {
      date = new Date(val);
    }
    
    if (isNaN(date.getTime())) return "N/A";
    
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (!isSuperAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-6 text-slate-100">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-slate-900 border border-red-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-red-950/20"
        >
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500 border border-red-500/20">
            <ShieldAlert size={32} className="animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold tracking-tight text-white uppercase">Access Denied</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              This panel is locked and strictly restricted to Platform Administrators. Your account 
              <span className="text-red-400 font-semibold font-mono block mt-1 break-all">{currentUser?.email || "unauthenticated_guest"}</span>
              is unauthorized. All unauthorized access triggers are logged automatically.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-full py-3 bg-red-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-red-400 transition-colors cursor-pointer"
          >
            Return to Safety
          </button>
        </motion.div>
      </div>
    );
  }

  // Define sidebar menu tabs
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: ClipboardList },
    { id: "users", label: "Brokers Directory", icon: Users },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* Side / Top Navigation Rail */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/[0.05] bg-slate-900/40 flex flex-row md:flex-col justify-between items-center md:items-stretch p-3 md:p-4 shrink-0">
        <div className="flex md:flex-col items-center md:items-stretch gap-3 md:gap-6 w-full md:w-auto justify-between">
          {/* Platform Header */}
          <div className="flex items-center gap-2.5 px-1 md:px-2">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h1 className="text-xs font-black tracking-widest text-white uppercase">Broker AI</h1>
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest font-mono hidden sm:inline">Super Admin</span>
            </div>
          </div>

          {/* Nav list */}
          <nav className="flex md:flex-col items-center gap-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 md:gap-3 px-2.5 md:px-3 py-1.5 md:py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    isActive 
                      ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10" 
                      : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                  }`}
                >
                  <Icon size={14} />
                  <span className="text-[11px] md:text-xs">{t.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="hidden md:block space-y-3 pt-4 border-t border-white/[0.03]">
          <div className="px-2">
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-mono">Operator:</span>
            <span className="block text-[10px] text-slate-300 font-bold truncate" title={currentUser?.email}>{currentUser?.email}</span>
          </div>
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] text-xs font-bold text-white rounded-xl transition-colors cursor-pointer"
          >
            <LogOut size={14} className="text-slate-400" />
            Exit Admin System
          </button>
        </div>

        {/* Mobile Exit Button */}
        <button
          onClick={onClose}
          className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
          title="Exit Admin"
        >
          <LogOut size={16} />
        </button>
      </aside>

      {/* Main Panel Content Stage */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-950">
        <header className="h-12 md:h-16 border-b border-white/[0.05] flex items-center justify-between px-4 md:px-8 bg-slate-900/15 shrink-0">
          <div className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-slate-400">
            Path: <span className="text-white">Admin / {activeTab.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-xs font-bold text-slate-500 font-mono">
            <span className="hidden sm:inline">PLATFORM: SECURE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </header>

        <div className="p-3.5 sm:p-6 md:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === "dashboard" && (
                <AdminDashboard 
                  currentUser={currentUser} 
                  formatCurrency={formatCurrency} 
                  formatDate={formatDate}
                  onNavigate={setActiveTab}
                />
              )}
              {activeTab === "users" && (
                <UserManagement 
                  currentUser={currentUser} 
                  formatDate={formatDate}
                  formatCurrency={formatCurrency}
                  units={units}
                  leads={leads}
                  refunds={refunds}
                  onAddUnit={onAddUnit}
                  onUpdateUnit={onUpdateUnit}
                  onDeleteUnit={onDeleteUnit}
                  onAddLead={onAddLead}
                  onClaimLead={onClaimLead}
                  onRequestRefund={onRequestRefund}
                  onClearAllLeads={onClearAllLeads}
                  onClearAllData={onClearAllData}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
