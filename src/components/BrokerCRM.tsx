import React, { useState, useRef, useEffect } from "react";
import { Unit, Lead, RefundRequest } from "../types";
import PropertyUploadWizard from "./PropertyUploadWizard";
import { 
  LayoutDashboard, Building2, Users, BarChart3, Settings, HelpCircle, LogOut,
  Search, Bell, Plus, MoreVertical, TrendingUp, ShieldCheck, Lock, Unlock,
  Mail, Phone, DollarSign, MapPin, Trash2, Edit3, Flame, Sun, Snowflake,
  Bed, Bath, X, CheckCircle2, AlertTriangle, Eye, ArrowUpDown, ChevronLeft,
  ChevronRight, RefreshCw, Layers, ShieldAlert, Sparkles, MessageSquare,
  Grid, List, Check, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BrokerCRMProps {
  isPremium: boolean;
  isSuperUser?: boolean;
  walletBalance: number;
  leads: Lead[];
  refunds: RefundRequest[];
  onSubscribe: (method: any) => Promise<void>;
  onClaimLead: (leadId: string, value: number) => Promise<void>;
  onRequestRefund: (leadId: string, leadName: string, reason: string, amount: number) => Promise<void>;
  formatCurrency: (amountInEGP: number) => string;
  onAddUnit: (unit: Omit<Unit, "id" | "createdAt">) => Promise<void>;
  onUpdateUnit: (unitId: string, updatedFields: Partial<Omit<Unit, "id" | "createdAt">>) => Promise<void>;
  onDeleteUnit: (unitId: string) => Promise<void>;
  onAddLead: (lead: Omit<Lead, "id" | "createdAt">) => Promise<void>;
  onClearAllLeads?: () => Promise<void>;
  onClearAllData?: () => Promise<void>;
  units: Unit[];
  currentUser?: any;
  onOpenChat?: () => void;
  onLogout?: () => void;
}

type TabType = "dashboard" | "inventory" | "leads" | "analytics" | "settings";

export default function BrokerCRM({
  isPremium,
  isSuperUser = false,
  walletBalance,
  leads,
  refunds,
  onSubscribe,
  onClaimLead,
  onRequestRefund,
  formatCurrency,
  onAddUnit,
  onUpdateUnit,
  onDeleteUnit,
  onAddLead,
  onClearAllLeads,
  onClearAllData,
  units,
  currentUser,
  onOpenChat,
  onLogout
}: BrokerCRMProps) {
  // Navigation tab matching CRM.md: dashboard (Overview), inventory, leads, analytics, settings
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Notifications state
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  // Filters
  const [globalSearch, setGlobalSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "verified">("all");
  const [ownerFilter, setOwnerFilter] = useState<"all" | "mine">("mine");
  const [leadFilter, setLeadFilter] = useState<"all" | "my_properties">("my_properties");
  const [inventoryViewMode, setInventoryViewMode] = useState<"table" | "grid">("table");

  // Pagination for inventory table
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Modals management
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);
  const [viewingUnitPhotos, setViewingUnitPhotos] = useState<Unit | null>(null);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  // Selected Lead details & Unlock modal
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [confirmLeadUnlock, setConfirmLeadUnlock] = useState<Lead | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);

  // Active row dropdown in table
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Fallback images
  const FALLBACK_IMAGES = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD99SG6yCJrCgqw8zreP75L9mtT2mH3tNSseL6k4QoI0o2nz5iqqTQXlAN9-UnUbHFSVxnH8ymxGK8TBi-eWWDJLJWTzLut2F6DVGfi8pYnbaeMZ_7FsoQHVzjFW2cQ7ebAaFDH6KvD8mb_z1Ll-6JT9jBVToKiqkXapGTCzdi5m7S2jzkYL00cxPHzntOns28N5oQJsz7QADQiQAq3KQHH8bItMtREbyj5m3_uBhmG6gPoZoymvbpx",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD56EsHONdf5cdUG15sIlq5fWjwjM8ci-BGLHOofGfs9WLtNTukdDAeV3dYJ0GuGqJ0PAVxSsZiPJax6IRcs7yhb5usnkl0LenS25njxycvyu1Hs6To-W2yGN8JXynjUM0UStolGc2WUO-khvlm_sTo7Osj8fjCHIe5hg4_9YYFsqqUwAuBSx8s1YSyQ5MseRCxGbIQ2IfJC-rBapUW25TUwz9mSnrm7Ce22g1xnW4lgL0YQDR6rbLO",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAQI1pXjvlSoa7sKaiGUicTRF1hn7I-obeFEXLVqutomTaDPb17oXV1mWd_z86OGkfJcT9GgTKu5-n8TIHw_fMgYHP_Qex3bRFH4W8rMjoEBdSzKBMpzLS3qvF3zNaQcU3GtLsRLyBAZvmq2Lpi8MMr1UASfoAso4SxOzpWg0r65pj5tAZnQ0CvNAjqkx6mgDJsVNOy9E0dK5Th54AvWDwrEdYJLGiSf5M09Awszt2yMjP7EaAhgnB-"
  ];

  const showNotification = (message: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Close active action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveActionMenuId(null);
    if (activeActionMenuId) {
      window.addEventListener("click", handleClickOutside);
      return () => window.removeEventListener("click", handleClickOutside);
    }
  }, [activeActionMenuId]);

  // Real scoped data
  const currentUid = currentUser?.uid || "guest_broker_user";
  const currentTenantId = currentUser?.tenantId || currentUid;

  // Real units filtering
  const userUnits = units.filter((unit) => {
    const isMine = unit.uploaderId === currentUid || (unit.tenantId && unit.tenantId === currentTenantId);
    const canSee = isSuperUser ? (ownerFilter === "all" ? true : isMine) : isMine;
    return canSee;
  });

  // Effective units matching search & status filter
  const filteredUnits = userUnits.filter((unit) => {
    const combinedSearch = (tableSearch || globalSearch).toLowerCase().trim();
    const matchesSearch = !combinedSearch || 
      (unit.title && unit.title.toLowerCase().includes(combinedSearch)) ||
      (unit.location && unit.location.toLowerCase().includes(combinedSearch)) ||
      (unit.propertyType && unit.propertyType.toLowerCase().includes(combinedSearch)) ||
      (unit.price && unit.price.toString().includes(combinedSearch)) ||
      (unit.id && unit.id.toLowerCase().includes(combinedSearch));

    if (!matchesSearch) return false;

    if (statusFilter === "verified") {
      return unit.legalPaperStatus === "verified_boost" || unit.legalPaperStatus === "verified";
    }

    return true;
  });

  // Real pagination calculations
  const totalEntries = filteredUnits.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedUnits = filteredUnits.slice(startIndex, startIndex + pageSize);

  // Real Leads filtering
  const userLeads = leads.filter((lead) => {
    const isMine = lead.propertyUploaderId === currentUid || 
                   (lead.tenantId && lead.tenantId === currentTenantId) ||
                   lead.claimedBy === currentUid;
    const canSee = isSuperUser ? (leadFilter === "all" ? true : isMine) : isMine;
    return canSee;
  });

  const filteredLeads = userLeads.filter((lead) => {
    const combinedSearch = (tableSearch || globalSearch).toLowerCase().trim();
    if (!combinedSearch) return true;
    return (
      (lead.name && lead.name.toLowerCase().includes(combinedSearch)) ||
      (lead.location && lead.location.toLowerCase().includes(combinedSearch)) ||
      (lead.propertyType && lead.propertyType.toLowerCase().includes(combinedSearch)) ||
      (lead.interestedUnitTitle && lead.interestedUnitTitle.toLowerCase().includes(combinedSearch)) ||
      (lead.budget && lead.budget.toString().includes(combinedSearch))
    );
  });

  // Real stats calculations
  const totalUnitsCount = userUnits.length;
  const verifiedUnitsCount = userUnits.filter(u => u.legalPaperStatus === "verified_boost" || u.legalPaperStatus === "verified").length;
  const totalLeadsCount = userLeads.length;
  const hotLeadsCount = userLeads.filter(l => l.qualification === "hot").length;
  const warmLeadsCount = userLeads.filter(l => l.qualification === "warm").length;
  const coldLeadsCount = userLeads.filter(l => l.qualification === "cold").length;
  const claimedLeadsCount = userLeads.filter(l => l.status === "claimed").length;
  const totalPortfolioValue = userUnits.reduce((acc, u) => acc + (Number(u.price) || 0), 0);
  const avgUnitPrice = totalUnitsCount > 0 ? Math.round(totalPortfolioValue / totalUnitsCount) : 0;

  // Actions
  const openUploadModal = () => {
    setEditingUnit(null);
    setIsUploadModalOpen(true);
  };

  const openEditModal = (unit: Unit) => {
    setEditingUnit(unit);
    setIsUploadModalOpen(true);
  };

  const executeDeleteUnit = async () => {
    if (!deletingUnitId) return;
    try {
      await onDeleteUnit(deletingUnitId);
      showNotification("Property listing successfully deleted", "success");
    } catch (err: any) {
      showNotification(err.message || "Failed to delete property", "error");
    } finally {
      setDeletingUnitId(null);
    }
  };

  const executeClaimLead = async () => {
    if (!confirmLeadUnlock) return;
    try {
      await onClaimLead(confirmLeadUnlock.id!, confirmLeadUnlock.value);
      showNotification("Lead contact details unlocked successfully!", "success");
      // Update selected lead to claimed state
      if (selectedLead && selectedLead.id === confirmLeadUnlock.id) {
        setSelectedLead({ ...selectedLead, status: "claimed" });
      }
    } catch (err: any) {
      showNotification(err.message || "Failed to unlock lead.", "error");
    } finally {
      setConfirmLeadUnlock(null);
    }
  };

  const handleRequestRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !refundReason.trim()) return;
    setSubmittingRefund(true);
    try {
      await onRequestRefund(selectedLead.id!, selectedLead.name, refundReason, selectedLead.value);
      showNotification("Refund request submitted. The AI agent will audit the transcript.", "info");
      setShowRefundModal(false);
      setRefundReason("");
    } catch (err: any) {
      showNotification(err.message || "Failed to submit refund claim.", "error");
    } finally {
      setSubmittingRefund(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-[#e5e2e1] overflow-hidden select-none font-sans" id="crm-main-container">
      
      {/* TOAST NOTIFICATION CONTAINER */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-2xl border text-sm flex items-center gap-3 backdrop-blur-xl ${
              notification.type === "success" 
                ? "bg-[#064e3b]/95 border-[#047857] text-[#34d399]" 
                : notification.type === "error"
                  ? "bg-[#451a03]/95 border-[#78350f] text-[#fbbf24]"
                  : "bg-[#1c1b1b]/95 border-[#444748] text-white"
            }`}
          >
            <CheckCircle2 size={16} className="shrink-0" />
            <span className="font-medium text-xs">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SideNavBar - CLONED FROM CRM.md */}
      <nav className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#131313] border-r border-[#444748] py-5 px-3 flex flex-col justify-between shrink-0 transition-transform duration-300
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-[#444748] shrink-0 bg-[#2a2a2a] flex items-center justify-center">
              <img 
                alt="Broker AI Logo" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqB6Jzosn_rGYJ5j6tm0d7juhZGr03qP1vAXg3F1hdbsda6It_F8eVf85NzSEz6d3QKCde5lU_VcZcfXXrk7ujcbf5nXp46wIUjE657qSqk4o3hFzwBhhWfY3Wz26EWq4G_4jAeq2rT6UjPGq_lkW85qGLP5D6VGcP3maN286-XDJnptId8dMyq_Nbaw1LN3skKRFFDXvoQHvzTTTbWOZnXpPkhzFJt3HoVoR7c8I-g7doqYpuTW136JsL8vZeMUS86w"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-white tracking-tight truncate">Broker AI</h1>
              <p className="text-[11px] text-[#c4c7c8] truncate font-mono">
                {isSuperUser ? "CRM - Admin" : isPremium ? "CRM - Pro" : "CRM - Free"}
              </p>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)} 
              className="md:hidden ml-auto p-1 text-[#c4c7c8] hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <button
              onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-[#2a2a2a] text-white font-bold border-r-2 border-white"
                  : "text-[#c4c7c8] hover:bg-[#2a2a2a] hover:text-white font-normal"
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard size={18} className={activeTab === "dashboard" ? "text-white" : "text-[#c4c7c8]"} />
                <span>Dashboard</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab("inventory"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors cursor-pointer ${
                activeTab === "inventory"
                  ? "bg-[#2a2a2a] text-white font-bold border-r-2 border-white"
                  : "text-[#c4c7c8] hover:bg-[#2a2a2a] hover:text-white font-normal"
              }`}
            >
              <div className="flex items-center gap-3">
                <Building2 size={18} className={activeTab === "inventory" ? "text-white" : "text-[#c4c7c8]"} />
                <span>Inventory</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-[#1c1b1b] text-[#c4c7c8] px-2 py-0.5 rounded border border-[#444748]">
                {totalUnitsCount}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("leads"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors cursor-pointer ${
                activeTab === "leads"
                  ? "bg-[#2a2a2a] text-white font-bold border-r-2 border-white"
                  : "text-[#c4c7c8] hover:bg-[#2a2a2a] hover:text-white font-normal"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users size={18} className={activeTab === "leads" ? "text-white" : "text-[#c4c7c8]"} />
                <span>Leads</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-[#1c1b1b] text-[#c4c7c8] px-2 py-0.5 rounded border border-[#444748]">
                {totalLeadsCount}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab("analytics"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors cursor-pointer ${
                activeTab === "analytics"
                  ? "bg-[#2a2a2a] text-white font-bold border-r-2 border-white"
                  : "text-[#c4c7c8] hover:bg-[#2a2a2a] hover:text-white font-normal"
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 size={18} className={activeTab === "analytics" ? "text-white" : "text-[#c4c7c8]"} />
                <span>Analytics</span>
              </div>
            </button>

            <button
              onClick={() => { setActiveTab("settings"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors cursor-pointer ${
                activeTab === "settings"
                  ? "bg-[#2a2a2a] text-white font-bold border-r-2 border-white"
                  : "text-[#c4c7c8] hover:bg-[#2a2a2a] hover:text-white font-normal"
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings size={18} className={activeTab === "settings" ? "text-white" : "text-[#c4c7c8]"} />
                <span>Settings</span>
              </div>
            </button>
          </div>
        </div>

        {/* Footer Links */}
        <div className="space-y-1 pt-4 border-t border-[#444748]">
          {onOpenChat && (
            <button
              onClick={() => { onOpenChat(); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-[#c4c7c8] hover:bg-[#2a2a2a] hover:text-white transition-colors cursor-pointer"
            >
              <MessageSquare size={18} />
              <span>AI Chat Assistant</span>
            </button>
          )}

          <button
            onClick={() => setSupportModalOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-[#c4c7c8] hover:bg-[#2a2a2a] hover:text-white transition-colors cursor-pointer"
          >
            <HelpCircle size={18} />
            <span>Support</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-[#ffb4aa] hover:bg-[#93000a]/40 hover:text-[#ffdad6] transition-colors cursor-pointer"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* TopAppBar - CLONED FROM CRM.md */}
        <header className="flex justify-between items-center h-16 px-4 md:px-8 bg-[#1c1b1b] border-b border-[#444748] shrink-0 z-10 w-full">
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(true)} 
            className="md:hidden text-[#c4c7c8] hover:text-white mr-3 cursor-pointer p-1"
          >
            <LayoutDashboard size={20} />
          </button>

          {/* Brand focus on mobile */}
          <div className="md:hidden text-base font-bold text-white flex-1">Broker AI</div>

          {/* Global Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c4c7c8]/60" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setTableSearch(e.target.value);
              }}
              placeholder="Search units, leads, transactions..."
              className="w-full bg-[#0A0A0A] border border-[#282828] text-white placeholder-[#c4c7c8]/40 rounded py-2 pl-9 pr-4 focus:outline-none focus:border-white text-xs font-sans transition-colors"
            />
            {globalSearch && (
              <button 
                onClick={() => { setGlobalSearch(""); setTableSearch(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Actions on Right */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="text-[#c4c7c8] hover:text-white p-2 relative cursor-pointer rounded-full hover:bg-white/5 transition-colors"
              >
                <Bell size={18} />
                {hotLeadsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#c5020b] rounded-full animate-pulse" />
                )}
              </button>

              {/* Notification dropdown */}
              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-[#1c1b1b] border border-[#444748] rounded-xl shadow-2xl p-4 z-50 space-y-3">
                  <div className="flex justify-between items-center border-b border-[#444748] pb-2">
                    <span className="text-xs font-bold text-white">Live Alerts</span>
                    <span className="text-[10px] text-[#c4c7c8] font-mono">{hotLeadsCount} new</span>
                  </div>
                  {hotLeadsCount > 0 ? (
                    <div className="space-y-2 text-xs">
                      {userLeads.filter(l => l.qualification === "hot").slice(0, 3).map((l, i) => (
                        <div key={i} className="p-2 bg-[#2a2a2a] rounded-lg border border-white/5 space-y-1">
                          <p className="text-white font-semibold flex items-center gap-1">
                            <Flame size={12} className="text-red-400" />
                            High Intent Prospect: {l.name}
                          </p>
                          <p className="text-[10px] text-[#c4c7c8] truncate">
                            Interested in {l.interestedUnitTitle || l.propertyType}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#c4c7c8] text-center py-3">No pending notifications</p>
                  )}
                </div>
              )}
            </div>

            {/* Profile badge */}
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#444748] bg-[#2a2a2a] flex items-center justify-center text-xs font-bold text-white">
              {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : "B"}
            </div>

            {/* Primary Action Button - Cloned from CRM.md */}
            <button 
              onClick={openUploadModal}
              className="bg-white text-[#131313] font-bold text-xs py-1.5 px-4 rounded-full border border-white hover:bg-opacity-90 transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
            >
              <div className="w-5 h-5 rounded-full bg-[#131313] text-white flex items-center justify-center">
                <Plus size={14} className="font-bold" />
              </div>
              <span>Upload new property</span>
            </button>
          </div>
        </header>

        {/* Main Scrollable Canvas */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#050505] scrollbar-thin">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* VIEW 1: DASHBOARD (OVERVIEW) */}
            {activeTab === "dashboard" && (
              <>
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[#c4c7c8] mb-1">
                      <span className="text-[11px] font-mono font-bold tracking-wider uppercase">Broker AI Workspace</span>
                    </div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">Overview</h2>
                    <p className="text-[#c4c7c8] mt-1 text-sm">
                      Monitor your portfolio performance, recent leads, and active transactions.
                    </p>
                  </div>
                </div>

                {/* Stats Bento Grid (3 Cards) - CLONED FROM CRM.md */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Stat Card 1: Total Units */}
                  <div className="bg-[#131313] border border-[#444748] p-5 rounded flex flex-col justify-between h-32 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="flex justify-between items-start z-10">
                      <span className="text-[#c4c7c8] text-[11px] uppercase tracking-wider font-bold">Total Units</span>
                      <Building2 size={20} className="text-[#c4c7c8]" />
                    </div>
                    <div className="z-10 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white font-mono">{totalUnitsCount}</span>
                      {verifiedUnitsCount > 0 && (
                        <span className="text-[#4ade80] text-xs flex items-center font-bold">
                          <TrendingUp size={14} className="mr-0.5" /> {verifiedUnitsCount} Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stat Card 2: Total Leads */}
                  <div className="bg-[#131313] border border-[#444748] p-5 rounded flex flex-col justify-between h-32 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="flex justify-between items-start z-10">
                      <span className="text-[#c4c7c8] text-[11px] uppercase tracking-wider font-bold">Total Leads</span>
                      <Users size={20} className="text-[#c4c7c8]" />
                    </div>
                    <div className="z-10 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white font-mono">{totalLeadsCount}</span>
                      {hotLeadsCount > 0 && (
                        <span className="text-[#4ade80] text-xs flex items-center font-bold">
                          <TrendingUp size={14} className="mr-0.5" /> {hotLeadsCount} Hot
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stat Card 3: Active Transactions / Unlocked Leads */}
                  <div className="bg-[#131313] border border-[#444748] p-5 rounded flex flex-col justify-between h-32 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="flex justify-between items-start z-10">
                      <span className="text-[#c4c7c8] text-[11px] uppercase tracking-wider font-bold">Active Transactions</span>
                      <DollarSign size={20} className="text-[#c4c7c8]" />
                    </div>
                    <div className="z-10 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white font-mono">{claimedLeadsCount}</span>
                      <span className="text-[#c4c7c8] text-xs">Unlocked Prospects</span>
                    </div>
                  </div>
                </div>

                {/* Inventory Section - CLONED FROM CRM.md */}
                <div className="bg-[#131313] border border-[#444748] rounded flex flex-col overflow-hidden">
                  {/* Section Header & Filters */}
                  <div className="p-5 border-b border-[#444748] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-lg text-white font-semibold">Unit Inventory</h3>
                      <p className="text-[#c4c7c8] text-xs mt-1">Manage listings and monitor certification metrics.</p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                      <div className="relative w-full md:w-64">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c4c7c8]/50" />
                        <input
                          type="text"
                          value={tableSearch}
                          onChange={(e) => {
                            setTableSearch(e.target.value);
                            setCurrentPage(1);
                          }}
                          placeholder="Search units (EGP)..."
                          className="w-full bg-[#0A0A0A] border border-[#282828] text-white placeholder-[#c4c7c8]/40 rounded py-1.5 pl-9 pr-3 focus:outline-none focus:border-white text-xs"
                        />
                      </div>

                      <div className="flex items-center gap-1 bg-[#0A0A0A] border border-[#282828] rounded p-1">
                        <button
                          onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}
                          className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                            statusFilter === "all"
                              ? "bg-[#2a2a2a] text-white"
                              : "text-[#c4c7c8] hover:text-white"
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => { setStatusFilter("verified"); setCurrentPage(1); }}
                          className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                            statusFilter === "verified"
                              ? "bg-[#2a2a2a] text-white"
                              : "text-[#c4c7c8] hover:text-white"
                          }`}
                        >
                          Verified Only
                        </button>
                      </div>

                      {isSuperUser && (
                        <div className="flex items-center gap-1 bg-[#0A0A0A] border border-[#282828] rounded p-1">
                          <button
                            onClick={() => { setOwnerFilter("all"); setCurrentPage(1); }}
                            className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                              ownerFilter === "all"
                                ? "bg-[#2a2a2a] text-white"
                                : "text-[#c4c7c8] hover:text-white"
                            }`}
                          >
                            All Properties
                          </button>
                          <button
                            onClick={() => { setOwnerFilter("mine"); setCurrentPage(1); }}
                            className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                              ownerFilter === "mine"
                                ? "bg-[#2a2a2a] text-white"
                                : "text-[#c4c7c8] hover:text-white"
                            }`}
                          >
                            My Uploads
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Data Table - CLONED FROM CRM.md */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-[#444748] bg-[#121212]">
                          <th className="py-3 px-4 text-xs font-medium text-[#c4c7c8] uppercase tracking-wider">Property Name</th>
                          <th className="py-3 px-4 text-xs font-medium text-[#c4c7c8] uppercase tracking-wider">Location</th>
                          <th className="py-3 px-4 text-xs font-medium text-[#c4c7c8] uppercase tracking-wider">Price (EGP)</th>
                          <th className="py-3 px-4 text-xs font-medium text-[#c4c7c8] uppercase tracking-wider">Status</th>
                          <th className="py-3 px-4 text-xs font-medium text-[#c4c7c8] uppercase tracking-wider text-right">Leads</th>
                          <th className="py-3 px-4 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1A1A1A]">
                        {paginatedUnits.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 px-4 text-center">
                              <Building2 size={32} className="mx-auto text-[#c4c7c8]/40 mb-3" />
                              <p className="text-white font-bold text-sm">No properties in inventory yet</p>
                              <p className="text-xs text-[#c4c7c8] mt-1 max-w-sm mx-auto">
                                {tableSearch || globalSearch
                                  ? "No units match your search query. Try clearing filters."
                                  : "Click 'Upload new property' to register your first listing in the CRM."}
                              </p>
                              <button
                                onClick={openUploadModal}
                                className="mt-4 px-4 py-2 bg-white text-black font-bold text-xs rounded-full hover:bg-slate-200 transition cursor-pointer"
                              >
                                + Upload new property
                              </button>
                            </td>
                          </tr>
                        ) : (
                          paginatedUnits.map((unit, idx) => {
                            const isVerified = unit.legalPaperStatus === "verified_boost" || unit.legalPaperStatus === "verified";
                            const matchingLeads = leads.filter(l => 
                              (l.interestedUnitId && l.interestedUnitId === unit.id) ||
                              (l.interestedUnitTitle && unit.title && l.interestedUnitTitle.toLowerCase() === unit.title.toLowerCase())
                            );

                            return (
                              <tr 
                                key={unit.id || idx}
                                className={`${idx % 2 === 1 ? "bg-[#121212]" : "bg-transparent"} hover:bg-[#161616] transition-colors group`}
                              >
                                {/* Property Name */}
                                <td className="py-3 px-4 font-medium text-white text-sm">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-[#2a2a2a] overflow-hidden shrink-0 border border-white/10">
                                      <img
                                        src={unit.imageUrl || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]}
                                        alt={unit.title}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="block truncate max-w-xs">{unit.title}</span>
                                      <span className="text-[10px] text-[#c4c7c8] font-mono">
                                        {unit.propertyType || "Residential"} • {unit.visibility === "private" ? "Private" : "Public"}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Location */}
                                <td className="py-3 px-4 text-[#c4c7c8] text-xs">
                                  {unit.location || "Prime Location"}
                                </td>

                                {/* Price (EGP) */}
                                <td className="py-3 px-4 font-mono text-white font-bold text-xs">
                                  {unit.price ? formatCurrency(unit.price) : "Price on inquiry"}
                                </td>

                                {/* Status */}
                                <td className="py-3 px-4">
                                  {isVerified ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-[#064e3b] text-[#34d399] border border-[#047857]">
                                      Verified
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-[#451a03] text-[#fbbf24] border border-[#78350f]">
                                      Pending
                                    </span>
                                  )}
                                </td>

                                {/* Leads */}
                                <td className="py-3 px-4 text-right font-mono text-white text-xs font-bold">
                                  {matchingLeads.length > 0 ? matchingLeads.length : "-"}
                                </td>

                                {/* Actions */}
                                <td className="py-3 px-4 text-right relative">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveActionMenuId(activeActionMenuId === unit.id ? null : (unit.id || null));
                                    }}
                                    className="text-[#c4c7c8] hover:text-white p-1 rounded hover:bg-white/5 transition-opacity cursor-pointer"
                                  >
                                    <MoreVertical size={16} />
                                  </button>

                                  {activeActionMenuId === unit.id && (
                                    <div 
                                      onClick={(e) => e.stopPropagation()}
                                      className="absolute right-4 top-10 w-44 bg-[#1c1b1b] border border-[#444748] rounded-xl shadow-2xl py-1.5 z-50 text-left"
                                    >
                                      <button
                                        onClick={() => {
                                          openEditModal(unit);
                                          setActiveActionMenuId(null);
                                        }}
                                        className="w-full px-3.5 py-2 text-xs text-[#c4c7c8] hover:text-white hover:bg-[#2a2a2a] flex items-center gap-2 cursor-pointer"
                                      >
                                        <Edit3 size={13} />
                                        <span>Edit Listing</span>
                                      </button>

                                      <button
                                        onClick={() => {
                                          const newVisibility = unit.visibility === "private" ? "public" : "private";
                                          onUpdateUnit(unit.id!, { visibility: newVisibility });
                                          showNotification(
                                            newVisibility === "public"
                                              ? "Property is now Public (AI Marketplace visible)"
                                              : "Property is now Private (Isolated to your CRM)",
                                            "info"
                                          );
                                          setActiveActionMenuId(null);
                                        }}
                                        className="w-full px-3.5 py-2 text-xs text-[#c4c7c8] hover:text-white hover:bg-[#2a2a2a] flex items-center gap-2 cursor-pointer"
                                      >
                                        {unit.visibility === "private" ? <Unlock size={13} /> : <Lock size={13} />}
                                        <span>{unit.visibility === "private" ? "Make Public" : "Make Private"}</span>
                                      </button>

                                      <div className="h-[1px] bg-[#444748] my-1" />

                                      <button
                                        onClick={() => {
                                          setDeletingUnitId(unit.id!);
                                          setActiveActionMenuId(null);
                                        }}
                                        className="w-full px-3.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Trash2 size={13} />
                                        <span>Delete Property</span>
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination / Footer - CLONED FROM CRM.md */}
                  <div className="p-4 border-t border-[#444748] flex items-center justify-between text-xs text-[#c4c7c8]">
                    <span>
                      Showing {totalEntries === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + pageSize, totalEntries)} of {totalEntries} entries
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={safeCurrentPage <= 1}
                        className="px-2.5 py-1 border border-[#444748] rounded hover:bg-[#2a2a2a] disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer font-medium"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={safeCurrentPage >= totalPages}
                        className="px-2.5 py-1 border border-[#444748] rounded hover:bg-[#2a2a2a] disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer font-medium"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* VIEW 2: FULL INVENTORY TAB */}
            {activeTab === "inventory" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Property Inventory</h2>
                    <p className="text-xs text-[#c4c7c8] mt-1">Manage and track your full real-estate portfolio across all registered developments.</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* View mode toggle */}
                    <div className="flex items-center bg-[#131313] border border-[#444748] rounded p-1">
                      <button
                        onClick={() => setInventoryViewMode("table")}
                        className={`p-1.5 rounded text-xs transition cursor-pointer ${
                          inventoryViewMode === "table" ? "bg-[#2a2a2a] text-white" : "text-[#c4c7c8] hover:text-white"
                        }`}
                        title="Table View"
                      >
                        <List size={16} />
                      </button>
                      <button
                        onClick={() => setInventoryViewMode("grid")}
                        className={`p-1.5 rounded text-xs transition cursor-pointer ${
                          inventoryViewMode === "grid" ? "bg-[#2a2a2a] text-white" : "text-[#c4c7c8] hover:text-white"
                        }`}
                        title="Card Grid View"
                      >
                        <Grid size={16} />
                      </button>
                    </div>

                    <button
                      onClick={openUploadModal}
                      className="bg-white text-black font-bold text-xs py-2 px-4 rounded-full flex items-center gap-2 hover:bg-slate-200 cursor-pointer"
                    >
                      <Plus size={15} />
                      <span>Upload New Property</span>
                    </button>
                  </div>
                </div>

                {inventoryViewMode === "grid" ? (
                  /* Bento Grid View */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUnits.length === 0 ? (
                      <div className="col-span-full py-16 text-center bg-[#131313] border border-[#444748] rounded-xl p-8">
                        <Building2 size={36} className="mx-auto text-slate-500 mb-3" />
                        <h4 className="text-base font-bold text-white">No Properties Listed</h4>
                        <p className="text-xs text-slate-400 mt-1 mb-4">You have not uploaded any property listings yet.</p>
                        <button
                          onClick={openUploadModal}
                          className="px-4 py-2 bg-white text-black font-bold text-xs rounded-full hover:bg-slate-200 cursor-pointer"
                        >
                          + Upload Property
                        </button>
                      </div>
                    ) : (
                      filteredUnits.map((unit, idx) => {
                        const isVerified = unit.legalPaperStatus === "verified_boost" || unit.legalPaperStatus === "verified";
                        return (
                          <div 
                            key={unit.id || idx}
                            className="bg-[#131313] border border-[#444748] rounded-xl overflow-hidden flex flex-col justify-between hover:border-white/40 transition-all group"
                          >
                            <div className="relative h-44 bg-slate-900 overflow-hidden">
                              <img
                                src={unit.imageUrl || FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]}
                                alt={unit.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                              />
                              {isVerified && (
                                <span className="absolute top-3 left-3 bg-[#064e3b] text-[#34d399] border border-[#047857] px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 font-mono">
                                  <ShieldCheck size={12} />
                                  Verified
                                </span>
                              )}
                              <span className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded text-xs font-mono font-bold text-white border border-[#444748]">
                                {formatCurrency(unit.price)}
                              </span>
                            </div>

                            <div className="p-4 flex-1 flex flex-col justify-between gap-3 text-left">
                              <div className="space-y-1">
                                <h3 className="font-bold text-white text-sm line-clamp-1">{unit.title}</h3>
                                <p className="text-xs text-[#c4c7c8] flex items-center gap-1">
                                  <MapPin size={12} className="text-slate-400" />
                                  {unit.location}
                                </p>
                                <p className="text-xs text-slate-400 line-clamp-2 mt-1">{unit.description}</p>
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t border-[#444748] text-xs">
                                <button
                                  onClick={() => openEditModal(unit)}
                                  className="text-[#c4c7c8] hover:text-white flex items-center gap-1 font-medium cursor-pointer"
                                >
                                  <Edit3 size={13} />
                                  Edit
                                </button>
                                <button
                                  onClick={() => setDeletingUnitId(unit.id!)}
                                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  /* Cloned Table View */
                  <div className="bg-[#131313] border border-[#444748] rounded overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-[#444748] bg-[#121212]">
                            <th className="py-3 px-4 text-xs font-medium text-[#c4c7c8] uppercase tracking-wider">Property Name</th>
                            <th className="py-3 px-4 text-xs font-medium text-[#c4c7c8] uppercase tracking-wider">Location</th>
                            <th className="py-3 px-4 text-xs font-medium text-[#c4c7c8] uppercase tracking-wider">Price (EGP)</th>
                            <th className="py-3 px-4 text-xs font-medium text-[#c4c7c8] uppercase tracking-wider">Status</th>
                            <th className="py-3 px-4 text-xs font-medium text-[#c4c7c8] uppercase tracking-wider text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1A1A1A]">
                          {filteredUnits.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                                No properties found matching your criteria.
                              </td>
                            </tr>
                          ) : (
                            filteredUnits.map((unit, idx) => (
                              <tr key={unit.id || idx} className="hover:bg-[#161616] transition-colors">
                                <td className="py-3 px-4 text-white font-medium text-sm">
                                  {unit.title}
                                </td>
                                <td className="py-3 px-4 text-[#c4c7c8] text-xs">{unit.location}</td>
                                <td className="py-3 px-4 font-mono text-white font-bold text-xs">{formatCurrency(unit.price)}</td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                    unit.legalPaperStatus === "verified_boost" || unit.legalPaperStatus === "verified"
                                      ? "bg-[#064e3b] text-[#34d399] border-[#047857]"
                                      : "bg-[#451a03] text-[#fbbf24] border-[#78350f]"
                                  }`}>
                                    {unit.legalPaperStatus === "verified_boost" || unit.legalPaperStatus === "verified" ? "Verified" : "Pending"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => openEditModal(unit)}
                                      className="p-1.5 hover:bg-white/10 rounded text-slate-300 hover:text-white transition cursor-pointer"
                                      title="Edit"
                                    >
                                      <Edit3 size={14} />
                                    </button>
                                    <button
                                      onClick={() => setDeletingUnitId(unit.id!)}
                                      className="p-1.5 hover:bg-red-500/20 rounded text-rose-400 hover:text-rose-300 transition cursor-pointer"
                                      title="Delete"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3: LEADS CENTER TAB */}
            {activeTab === "leads" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Leads & Prospects</h2>
                    <p className="text-xs text-[#c4c7c8] mt-1">Direct inquiries generated from buyers interacting with your properties.</p>
                  </div>
                  {onClearAllLeads && userLeads.length > 0 && (
                    <button
                      onClick={async () => {
                        if (window.confirm("Are you sure you want to clear all leads?")) {
                          await onClearAllLeads();
                          showNotification("All leads cleared", "info");
                        }
                      }}
                      className="px-3 py-1.5 rounded border border-rose-500/30 text-rose-400 hover:bg-rose-950/40 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 size={13} />
                      Clear All Leads
                    </button>
                  )}
                </div>

                {/* Lead Bento Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#131313] border border-[#444748] p-4 rounded text-left">
                    <span className="text-[11px] text-[#c4c7c8] uppercase font-bold">Total Inquiries</span>
                    <h4 className="text-2xl font-bold text-white mt-1 font-mono">{totalLeadsCount}</h4>
                  </div>
                  <div className="bg-[#131313] border border-[#444748] p-4 rounded text-left">
                    <span className="text-[11px] text-red-400 uppercase font-bold flex items-center gap-1">
                      <Flame size={13} /> Hot Leads
                    </span>
                    <h4 className="text-2xl font-bold text-white mt-1 font-mono">{hotLeadsCount}</h4>
                  </div>
                  <div className="bg-[#131313] border border-[#444748] p-4 rounded text-left">
                    <span className="text-[11px] text-amber-400 uppercase font-bold flex items-center gap-1">
                      <Sun size={13} /> Warm Leads
                    </span>
                    <h4 className="text-2xl font-bold text-white mt-1 font-mono">{warmLeadsCount}</h4>
                  </div>
                  <div className="bg-[#131313] border border-[#444748] p-4 rounded text-left">
                    <span className="text-[11px] text-emerald-400 uppercase font-bold flex items-center gap-1">
                      <Unlock size={13} /> Unlocked
                    </span>
                    <h4 className="text-2xl font-bold text-white mt-1 font-mono">{claimedLeadsCount}</h4>
                  </div>
                </div>

                {/* Leads Layout: List + Profile Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  
                  {/* Leads List */}
                  <div className="lg:col-span-2 space-y-3">
                    {filteredLeads.length === 0 ? (
                      <div className="bg-[#131313] border border-[#444748] rounded p-12 text-center">
                        <Users size={32} className="mx-auto text-slate-500 mb-3" />
                        <h4 className="text-base font-bold text-white">No Prospect Inquiries Yet</h4>
                        <p className="text-xs text-slate-400 mt-1">Leads will automatically arrive here as buyers chat and request property contacts.</p>
                      </div>
                    ) : (
                      filteredLeads.map((lead) => {
                        const isClaimed = lead.status === "claimed" || isSuperUser;
                        const isSelected = selectedLead?.id === lead.id;

                        return (
                          <div
                            key={lead.id}
                            onClick={() => setSelectedLead(lead)}
                            className={`p-4 rounded border transition-all cursor-pointer text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                              isSelected
                                ? "bg-[#201f1f] border-white text-white shadow-lg"
                                : "bg-[#131313] border-[#444748] hover:border-white/40 hover:bg-[#1a1a1a]"
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-white">
                                  {isClaimed ? lead.name : `Buyer Prospect #${lead.id?.slice(-4) || "New"}`}
                                </h4>
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                                  lead.qualification === "hot"
                                    ? "bg-[#451a03] text-[#fbbf24] border-[#78350f]"
                                    : "bg-[#2a2a2a] text-[#c4c7c8] border-[#444748]"
                                }`}>
                                  {lead.qualification || "Prospect"}
                                </span>
                              </div>
                              <p className="text-xs text-[#c4c7c8]">
                                Interested in: <strong className="text-white">{lead.interestedUnitTitle || lead.propertyType}</strong>
                              </p>
                              <div className="flex items-center gap-4 text-xs text-slate-400">
                                <span>{lead.location}</span>
                                <span>•</span>
                                <span className="font-mono text-white">{lead.budget}</span>
                              </div>
                            </div>

                            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                              {isClaimed ? (
                                <span className="bg-[#064e3b] text-[#34d399] border border-[#047857] text-[10px] font-bold uppercase px-3 py-1 rounded flex items-center gap-1 font-mono">
                                  <Unlock size={12} />
                                  Unlocked
                                </span>
                              ) : (
                                <button
                                  onClick={() => setConfirmLeadUnlock(lead)}
                                  className="bg-white hover:bg-slate-200 text-black font-bold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer shadow"
                                >
                                  <Lock size={12} />
                                  Unlock ({formatCurrency(lead.value || 1000)})
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Prospect Details Panel */}
                  <div className="lg:col-span-1 bg-[#131313] border border-[#444748] rounded p-5 space-y-4 text-left">
                    <div className="border-b border-[#444748] pb-3 flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#c4c7c8]">Prospect Dossier</h4>
                      {selectedLead && selectedLead.status === "claimed" && (
                        <button
                          onClick={() => setShowRefundModal(true)}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
                        >
                          Request Refund
                        </button>
                      )}
                    </div>

                    {selectedLead ? (() => {
                      const isClaimed = selectedLead.status === "claimed" || isSuperUser;
                      return (
                        <div className="space-y-4 text-xs">
                          <div>
                            <h3 className="text-base font-bold text-white">
                              {isClaimed ? selectedLead.name : `Buyer Prospect #${selectedLead.id?.slice(-4)}`}
                            </h3>
                            <div className="space-y-1 mt-2 font-mono">
                              <p className="text-slate-300 flex items-center gap-2">
                                <Mail size={12} className="text-[#c4c7c8]" />
                                {isClaimed ? selectedLead.email : "e******@gmail.com"}
                              </p>
                              <p className="text-emerald-400 flex items-center gap-2 font-bold">
                                <Phone size={12} />
                                {isClaimed ? (selectedLead.phone || "Not specified") : "+20 10********"}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2 border-t border-[#444748] pt-3">
                            <div className="flex justify-between py-1 border-b border-[#282828]">
                              <span className="text-[#c4c7c8]">Target Unit:</span>
                              <span className="font-bold text-white truncate max-w-[150px]">{selectedLead.interestedUnitTitle || "Direct"}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-[#282828]">
                              <span className="text-[#c4c7c8]">Location:</span>
                              <span className="font-bold text-white">{selectedLead.location}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-[#282828]">
                              <span className="text-[#c4c7c8]">Budget:</span>
                              <span className="font-bold text-white font-mono">{selectedLead.budget}</span>
                            </div>
                          </div>

                          {!isClaimed ? (
                            <div className="p-4 bg-[#1c1b1b] border border-dashed border-[#444748] rounded text-center space-y-3 mt-4">
                              <Lock size={20} className="mx-auto text-[#c4c7c8]" />
                              <p className="text-xs text-[#c4c7c8]">Contact information is locked. Unlock instantly with Visa, Mastercard, or Instapay.</p>
                              <button
                                onClick={() => setConfirmLeadUnlock(selectedLead)}
                                className="w-full py-2 bg-white text-black font-bold text-xs rounded hover:bg-slate-200 cursor-pointer"
                              >
                                Unlock Contact ({formatCurrency(selectedLead.value || 1000)})
                              </button>
                            </div>
                          ) : (
                            <div className="p-3 bg-[#064e3b]/20 border border-[#047857]/40 rounded space-y-1">
                              <span className="text-[10px] font-bold text-[#34d399] uppercase tracking-wider block">Unlocked Verified Lead</span>
                              <p className="text-slate-300 text-[11px] leading-relaxed">
                                You can now directly call or WhatsApp this prospect to arrange contract signing or viewing appointments.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })() : (
                      <p className="text-xs text-slate-500 py-12 text-center">
                        Select a lead from the list to view their requirements and contact information.
                      </p>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* VIEW 4: ANALYTICS TAB */}
            {activeTab === "analytics" && (
              <div className="space-y-6 text-left">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Portfolio Analytics</h2>
                  <p className="text-xs text-[#c4c7c8] mt-1">Live metrics evaluating your listed assets and buyer demand velocity.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#131313] border border-[#444748] p-5 rounded">
                    <span className="text-xs uppercase text-[#c4c7c8] font-bold">Total Portfolio Value</span>
                    <h3 className="text-2xl font-bold text-white mt-1 font-mono">{formatCurrency(totalPortfolioValue)}</h3>
                    <p className="text-[10px] text-slate-400 mt-2">Combined listed inventory value</p>
                  </div>
                  <div className="bg-[#131313] border border-[#444748] p-5 rounded">
                    <span className="text-xs uppercase text-[#c4c7c8] font-bold">Average Unit Price</span>
                    <h3 className="text-2xl font-bold text-white mt-1 font-mono">{formatCurrency(avgUnitPrice)}</h3>
                    <p className="text-[10px] text-slate-400 mt-2">Per property listing</p>
                  </div>
                  <div className="bg-[#131313] border border-[#444748] p-5 rounded">
                    <span className="text-xs uppercase text-[#c4c7c8] font-bold">Verification Rate</span>
                    <h3 className="text-2xl font-bold text-[#34d399] mt-1 font-mono">
                      {totalUnitsCount > 0 ? `${Math.round((verifiedUnitsCount / totalUnitsCount) * 100)}%` : "0%"}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-2">{verifiedUnitsCount} of {totalUnitsCount} units verified</p>
                  </div>
                </div>

                {/* Breakdown by Type */}
                <div className="bg-[#131313] border border-[#444748] p-6 rounded space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Asset Distribution by Type</h4>
                  <div className="space-y-3">
                    {["Villa", "Apartment", "Townhouse", "Twin House", "Penthouse", "Chalet", "Commercial"].map((type) => {
                      const count = userUnits.filter(u => (u.propertyType || "").toLowerCase() === type.toLowerCase()).length;
                      const percentage = totalUnitsCount > 0 ? Math.round((count / totalUnitsCount) * 100) : 0;
                      return (
                        <div key={type} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-300 font-medium">{type}</span>
                            <span className="font-mono text-white font-bold">{count} ({percentage}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                            <div className="h-full bg-white transition-all duration-500" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 5: SETTINGS TAB */}
            {activeTab === "settings" && (
              <div className="space-y-6 text-left max-w-3xl">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Workspace Settings</h2>
                  <p className="text-xs text-[#c4c7c8] mt-1">Configure your broker workspace, isolation keys, and data registry.</p>
                </div>

                <div className="bg-[#131313] border border-[#444748] p-6 rounded space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#444748] pb-2">
                    Organization Profile
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[#c4c7c8] block mb-1">Account Email</span>
                      <input
                        type="text"
                        disabled
                        value={currentUser?.email || "broker@brokerai.com"}
                        className="w-full bg-[#0A0A0A] border border-[#282828] text-white p-2.5 rounded text-xs font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[#c4c7c8] block mb-1">Tenant ID</span>
                      <input
                        type="text"
                        disabled
                        value={currentTenantId}
                        className="w-full bg-[#0A0A0A] border border-[#282828] text-white p-2.5 rounded text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {onClearAllData && (
                  <div className="bg-[#131313] border border-rose-500/30 p-6 rounded space-y-3">
                    <div className="flex items-center gap-2 text-rose-400">
                      <Trash2 size={16} />
                      <h4 className="text-sm font-bold uppercase tracking-wider">System Reset (Zero State)</h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Purge all database records (properties, leads, and transaction logs) to test or train the AI assistant with zero data from scratch.
                    </p>
                    <button
                      onClick={async () => {
                        if (window.confirm("Are you sure you want to wipe all records and start fresh from zero?")) {
                          try {
                            await onClearAllData();
                            showNotification("All database records wiped out successfully", "success");
                          } catch (err: any) {
                            showNotification(err.message || "Failed to reset database", "error");
                          }
                        }
                      }}
                      className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-xs rounded transition cursor-pointer"
                    >
                      Wipe All Data & Start Fresh ⚠️
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* --- PROPERTY UPLOAD WIZARD MODAL --- */}
      <PropertyUploadWizard
        isOpen={isUploadModalOpen || editingUnit !== null}
        onClose={() => {
          setIsUploadModalOpen(false);
          setEditingUnit(null);
        }}
        onAddUnit={onAddUnit}
        onUpdateUnit={onUpdateUnit}
        editingUnit={editingUnit}
        formatCurrency={formatCurrency}
      />

      {/* --- CONFIRM DELETE PROPERTY MODAL --- */}
      <AnimatePresence>
        {deletingUnitId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#131313] border border-[#444748] rounded-xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
                <Trash2 size={20} />
              </div>
              <h3 className="text-base font-bold text-white">Delete Listing</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete this property from the registry?
              </p>

              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingUnitId(null)}
                  className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold px-4 py-2 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeDeleteUnit}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-5 py-2 rounded transition cursor-pointer"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CONFIRM UNLOCK LEAD MODAL --- */}
      <AnimatePresence>
        {confirmLeadUnlock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#131313] border border-[#444748] rounded-xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 border border-[#444748] flex items-center justify-center mx-auto text-white">
                <Lock size={20} />
              </div>
              <h3 className="text-base font-bold text-white">Direct Pay & Unlock Details</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Unlock full phone number and email with an instant direct payment via Visa, Mastercard, or Instapay.
              </p>

              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmLeadUnlock(null)}
                  className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold px-4 py-2 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeClaimLead}
                  className="bg-white hover:bg-slate-200 text-black text-xs font-bold px-5 py-2 rounded transition cursor-pointer"
                >
                  Yes, Unlock
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- REFUND MODAL --- */}
      <AnimatePresence>
        {showRefundModal && selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#131313] border border-[#444748] rounded-xl p-6 max-w-md w-full text-left shadow-2xl"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-base font-bold text-white">Request Refund</h3>
                  <p className="text-xs text-[#c4c7c8] mt-1">
                    If this prospect contact was non-genuine or cold, submit a claim for instant reimbursement.
                  </p>
                </div>
                <button 
                  onClick={() => setShowRefundModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRequestRefund} className="space-y-4 mt-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Refund Reason</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe why this prospect is invalid (e.g. phone disconnected, duplicate entry)..."
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full text-xs bg-black/50 border border-[#444748] rounded p-3 text-white outline-none focus:border-white resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowRefundModal(false)}
                    className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold px-4 py-2 rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRefund}
                    className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded transition disabled:opacity-50 cursor-pointer"
                  >
                    {submittingRefund ? "Submitting..." : "Submit Claim"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SUPPORT MODAL --- */}
      <AnimatePresence>
        {supportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#131313] border border-[#444748] rounded-xl p-6 max-w-md w-full text-left space-y-4 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-[#444748] pb-3">
                <h3 className="text-base font-bold text-white">Broker AI Support</h3>
                <button onClick={() => setSupportModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-3 text-xs text-[#c4c7c8]">
                <p>
                  Need assistance with uploading property deeds, managing AI lead routing, or customizing multi-tenant rules?
                </p>
                <div className="p-3 bg-[#1c1b1b] rounded border border-[#282828] space-y-1">
                  <span className="text-white font-bold block">Direct Developer Contact</span>
                  <p className="font-mono text-emerald-400">support@brokerai.com</p>
                  <p className="font-mono text-slate-400">+20 100 000 0000</p>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSupportModalOpen(false)}
                  className="px-4 py-2 bg-white text-black font-bold text-xs rounded hover:bg-slate-200 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
