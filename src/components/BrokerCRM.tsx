import React, { useState } from "react";
import { Lead, RefundRequest } from "../types";
import { 
  Users, ShieldCheck, Zap, Lock, Unlock, Mail, DollarSign, MapPin, 
  Building, RefreshCw, AlertTriangle, FileCheck, CheckCircle2, Award, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BrokerCRMProps {
  isPremium: boolean;
  walletBalance: number;
  leads: Lead[];
  refunds: RefundRequest[];
  onSubscribe: (method: any) => Promise<void>;
  onClaimLead: (leadId: string, value: number) => Promise<void>;
  onRequestRefund: (leadId: string, leadName: string, reason: string, amount: number) => Promise<void>;
  formatCurrency: (amountInEGP: number) => string;
}

export default function BrokerCRM({
  isPremium,
  walletBalance,
  leads,
  refunds,
  onSubscribe,
  onClaimLead,
  onRequestRefund,
  formatCurrency
}: BrokerCRMProps) {
  const [activeTab, setActiveTab] = useState<"leads" | "outsource" | "refunds">("leads");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [confirmLeadUnlock, setConfirmLeadUnlock] = useState<Lead | null>(null);

  const showNotification = (message: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Subscribing to Premium
  const handleSubscribe = async () => {
    try {
      await onSubscribe("visa");
      showNotification(`Success! You have activated Premium CRM benefits for ${formatCurrency(2000)}/Month.`, "success");
    } catch (err: any) {
      showNotification(err.message || "Subscription failed.", "error");
    }
  };

  // Claiming a Lead
  const handleClaimLeadConfirm = async (lead: Lead) => {
    setConfirmLeadUnlock(lead);
  };

  const executeClaimLead = async () => {
    if (!confirmLeadUnlock) return;
    try {
      await onClaimLead(confirmLeadUnlock.id!, confirmLeadUnlock.value);
      showNotification(`Lead unlocked successfully! Complete contact credentials are now available.`, "success");
    } catch (err: any) {
      showNotification(err.message || "Failed to unlock lead.", "error");
    } finally {
      setConfirmLeadUnlock(null);
    }
  };

  // Submitting Refund
  const handleRequestRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !refundReason.trim()) return;
    setSubmittingRefund(true);
    try {
      await onRequestRefund(selectedLead.id!, selectedLead.name, refundReason, selectedLead.value);
      showNotification("Refund claim submitted. Our AI auditor is reviewing the chat logs.", "info");
      setShowRefundModal(false);
      setRefundReason("");
    } catch (err: any) {
      showNotification(err.message || "Failed to submit refund.", "error");
    } finally {
      setSubmittingRefund(false);
    }
  };

  // Pre-loaded outsource leads as startup context
  const outsourceLeads: Lead[] = [];

  return (
    <div className="space-y-6 text-slate-100 relative">

      {/* CUSTOM LUXURY TOAST NOTIFICATION CONTAINER */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl border text-sm flex items-center gap-2 backdrop-blur-lg ${
              notification.type === "success" 
                ? "bg-emerald-950/90 border-emerald-500/20 text-emerald-200" 
                : notification.type === "error"
                  ? "bg-rose-950/90 border-rose-500/20 text-rose-200"
                  : "bg-blue-950/90 border-blue-500/20 text-blue-200"
            }`}
          >
            <CheckCircle2 size={16} className={notification.type === "success" ? "text-emerald-400" : "text-blue-400"} />
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* PREMIUM PAYWALL CRITICAL HEADER */}
      <div className="bg-gradient-to-br from-[#0c102a] to-[#040612] border border-white/5 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <Award className="text-yellow-400 fill-yellow-500 animate-pulse" size={22} />
            <span className="text-xs uppercase font-black tracking-widest text-blue-400 font-mono">Premium CRM Portal</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Elite Real Estate CRM Module</h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Access unlimited leads follow-up, automated qualification chat reviews, full outsourced lead management, and complete direct refunds under our <strong>Premium License</strong>.
          </p>
        </div>

        <div className="shrink-0 relative z-10">
          {isPremium ? (
            <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 font-bold px-4 py-2 rounded-full text-xs flex items-center gap-2 font-mono">
              <CheckCircle2 size={14} className="fill-emerald-500 text-slate-900" />
              Active Premium License
            </div>
          ) : (
            <button
              onClick={handleSubscribe}
              className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold px-6 py-3 rounded-full text-xs shadow-[0_0_20px_rgba(245,158,11,0.3)] transition transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              Activate Premium CRM License
            </button>
          )}
        </div>
      </div>

      {/* CRM TABS & CONTROLS */}
      <div className="flex border-b border-white/5 gap-1">
        <button
          onClick={() => setActiveTab("leads")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === "leads" 
              ? "border-blue-500 text-white font-black" 
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Qualified AI Leads ({leads.length})
        </button>
        <button
          onClick={() => setActiveTab("outsource")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === "outsource" 
              ? "border-blue-500 text-white font-black" 
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Outsource Market Leads
        </button>
        <button
          onClick={() => setActiveTab("refunds")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === "refunds" 
              ? "border-blue-500 text-white font-black" 
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Refund Claim Center ({refunds.length})
        </button>
      </div>

      {/* CONTENT PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEADS LIST PANEL */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* LEADS TAB CONTENT */}
          {activeTab === "leads" && (
            <div className="space-y-3">
              {leads.length === 0 ? (
                <div className="bg-black/30 border border-white/5 rounded-3xl p-12 text-center text-slate-300">
                  <Users className="mx-auto text-slate-500 mb-3 animate-pulse" size={32} />
                  <p className="text-sm font-bold text-white">No AI qualified leads found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try the AI Chat to dynamically qualify guest parameters and populate the CRM list!
                  </p>
                </div>
              ) : (
                leads.map((lead) => {
                  const isClaimed = lead.status === "claimed";
                  const isSelected = selectedLead?.id === lead.id;
                  return (
                    <div
                      key={lead.id}
                      onClick={() => isClaimed && setSelectedLead(lead)}
                      className={`bg-slate-950/45 border rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm transition-all duration-300 cursor-pointer ${
                        isSelected 
                          ? "border-[#5b8dff] bg-[#5b8dff]/12 ring-1 ring-[#5b8dff]/30 shadow-[0_0_24px_rgba(90,140,255,0.15)]" 
                          : "border-white/[0.08] hover:border-[#5b8dff]/40 hover:bg-slate-950/70"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-sm font-bold text-white">
                            {isClaimed ? lead.name : `Lead Explorer #${lead.id?.slice(-4) || "Premium"}`}
                          </h3>
                          <span className={`text-[9px] uppercase font-mono font-black px-2 py-0.5 rounded ${
                            lead.qualification === "hot" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                            lead.qualification === "warm" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}>
                            {lead.qualification} Lead
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><MapPin size={12} className="text-blue-400" /> {lead.location}</span>
                          <span className="flex items-center gap-1"><Building size={12} className="text-blue-400" /> {lead.propertyType}</span>
                          <span className="flex items-center gap-1 font-bold text-white"><DollarSign size={12} className="text-blue-400" /> {lead.budget}</span>
                        </div>
                      </div>

                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        {isClaimed ? (
                          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] uppercase font-black px-3 py-1.5 rounded-full flex items-center gap-1">
                            <Unlock size={12} />
                            Unlocked Details
                          </span>
                        ) : (
                          <button
                            onClick={() => handleClaimLeadConfirm(lead)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-full text-xs flex items-center gap-1.5 shadow-md shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all cursor-pointer"
                          >
                            <Lock size={12} />
                            Unlock Lead Details
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* OUTSOURCE TAB CONTENT */}
          {activeTab === "outsource" && (
            <div className="space-y-3">
              {outsourceLeads.length === 0 ? (
                <div className="bg-black/30 border border-white/5 rounded-3xl p-12 text-center text-slate-300">
                  <Users className="mx-auto text-slate-500 mb-3 animate-pulse" size={32} />
                  <p className="text-sm font-bold text-white">No outsource market leads found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Market leads have been successfully migrated or are empty.
                  </p>
                </div>
              ) : (
                outsourceLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="bg-black/40 border border-white/5 rounded-2xl p-5 flex justify-between items-center shadow-sm text-white hover:border-white/10 transition-all duration-300"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">Outsource: {lead.name}</h3>
                        <span className="bg-red-500/10 text-red-400 text-[9px] uppercase font-mono font-black px-2 py-0.5 rounded border border-red-500/20">
                          {lead.qualification}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 flex gap-2">
                        <span><strong>Loc:</strong> {lead.location}</span>
                        <span>•</span>
                        <span><strong>Type:</strong> {lead.propertyType}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (!isPremium) {
                          showNotification("Accessing outsourced leads requires an active Premium CRM License.", "error");
                          return;
                        }
                        handleClaimLeadConfirm(lead);
                      }}
                      className="bg-white/5 hover:bg-white/10 border border-white/5 text-white font-bold px-4 py-2 rounded-full text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all duration-300"
                    >
                      <Lock size={12} />
                      Unlock Outsource Lead
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* REFUNDS TAB CONTENT */}
          {activeTab === "refunds" && (
            <div className="space-y-3">
              {refunds.length === 0 ? (
                <div className="bg-black/30 border border-white/5 rounded-3xl p-12 text-center text-slate-300">
                  <AlertTriangle className="mx-auto text-slate-500 mb-3 animate-pulse" size={32} />
                  <p className="text-sm font-bold text-white">No refund requests submitted</p>
                  <p className="text-xs text-slate-400 mt-1">
                    If an unlocked Hot Lead is false, submit a claim to audit chat logs and process a refund.
                  </p>
                </div>
              ) : (
                refunds.map((ref) => (
                  <div
                    key={ref.id}
                    className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-3 shadow-sm text-white"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-black text-white">Refund Request for {ref.leadName}</h4>
                        <p className="text-[10px] text-slate-500 font-mono font-bold">ID: #{ref.id?.slice(0, 8)}</p>
                      </div>
                      <span className="text-xs font-black text-blue-400">{formatCurrency(ref.amount)}</span>
                    </div>

                    <p className="text-xs text-slate-300 italic bg-white/5 p-3 rounded-lg border border-white/5 leading-relaxed">
                      &ldquo;{ref.reason}&rdquo;
                    </p>

                    {/* Step tracker from PDF: Reporting -> Reviewing the chat -> Refund */}
                    <div className="grid grid-cols-3 gap-2.5 pt-3.5 border-t border-white/5 text-center text-[10px] font-bold font-mono uppercase tracking-wider">
                      <div className={`p-2 rounded-lg ${ref.status === "reporting" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                        1. Reporting
                      </div>
                      <div className={`p-2 rounded-lg ${
                        ref.status === "reviewing" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse" :
                        ref.status === "refunded" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-slate-600"
                      }`}>
                        2. Reviewing Chat
                      </div>
                      <div className={`p-2 rounded-lg ${ref.status === "refunded" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-slate-600"}`}>
                        3. Refund Processed
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* SELECTED LEAD DETAIL SCREEN */}
        <div className="bg-gradient-to-br from-[#0c102a] to-[#040612] border border-white/5 rounded-[28px] p-6 shadow-2xl space-y-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 border-b border-white/5 pb-2.5 font-display font-mono">
            Selected Lead Profile
          </h3>

          {selectedLead ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-black text-white">{selectedLead.name}</h4>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-mono font-bold">
                  <Mail size={12} className="text-blue-400" />
                  {selectedLead.email}
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400 font-medium">Target Budget:</span>
                  <strong className="text-white">{selectedLead.budget}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400 font-medium">Ideal Location:</span>
                  <strong className="text-white">{selectedLead.location}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400 font-medium">Property Type:</span>
                  <strong className="text-white">{selectedLead.propertyType}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-400 font-medium">License Check:</span>
                  <strong className="text-white">
                    {selectedLead.legalPapersRequired ? "Verified Papers Needed" : "Flexible"}
                  </strong>
                </div>
              </div>

              {/* Chat log review */}
              <div className="bg-white/5 border border-white/5 text-slate-300 p-4 rounded-2xl space-y-1.5 shadow-inner leading-relaxed">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest font-mono">AI Transcript Ledger</p>
                <p className="text-xs text-slate-400 leading-normal italic">
                  &ldquo;Extracted {selectedLead.qualification} Lead priority on budget {selectedLead.budget} in location {selectedLead.location}. Legal licensing required set to {selectedLead.legalPapersRequired ? "YES" : "NO"}.&rdquo;
                </p>
              </div>

              {/* Actions: Request Refund if Hot */}
              {selectedLead.qualification === "hot" && (
                <button
                  onClick={() => setShowRefundModal(true)}
                  className="w-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <AlertTriangle size={14} />
                  Report Inaccuracy
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs leading-relaxed">
              Select an unlocked lead to view full financial stream details and AI evaluation transcripts.
            </div>
          )}
        </div>

      </div>

      {/* CONFIRM UNLOCK LEAD MODAL */}
      {confirmLeadUnlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#060919]/95 border border-white/10 rounded-[32px] p-7 max-w-sm w-full shadow-[0_32px_96px_rgba(0,0,0,0.85)] text-white text-center"
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Lock size={20} />
            </div>
            <h3 className="text-lg font-black text-white font-display">Unlock Client Stream</h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Are you sure you want to unlock the contact information and full transcripts of this <strong className="uppercase text-white">{confirmLeadUnlock.qualification}</strong> lead?
            </p>

            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => setConfirmLeadUnlock(null)}
                className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeClaimLead}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:scale-105 transition cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              >
                Yes, Unlock
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* SUBMIT REFUND CLAIM MODAL */}
      {showRefundModal && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#060919]/95 border border-white/10 rounded-[32px] p-7 max-w-md w-full shadow-[0_32px_96px_rgba(0,0,0,0.85)] text-white"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-black text-white font-display">Claim Refund on False Lead</h3>
                <p className="text-xs text-slate-400">
                  Submit a detailed description of the inaccuracy. AI core will audit the transcript.
                </p>
              </div>
              <button 
                onClick={() => setShowRefundModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRequestRefund} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase tracking-wider">Reason for Refund Request</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Client stated they have no immediate budget and just wanted to compare, AI mistakenly flagged as Hot."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 placeholder-slate-600 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRefund}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4.5 py-2.5 rounded-xl hover:scale-105 transition disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                >
                  {submittingRefund ? "Auditing..." : "Submit Refund Claim"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
