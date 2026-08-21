import React, { useState, useEffect } from "react";
import { useBrokerData } from "./lib/useBrokerData";
import { COUNTRIES } from "./lib/countries";
import AIChat from "./components/AIChat";
import UnitsManager from "./components/UnitsManager";
import BrokerCRM from "./components/BrokerCRM";
import { LiquidMetalButton } from "./components/LiquidMetalButton";
import { 
  Building2, Users, HelpCircle, LogOut, Sparkles, LogIn, ShieldAlert, CheckCircle2, Settings, X, MessageSquare, Menu, Plus, History, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChatThread } from "./types";
import { cn } from "./lib/utils";
// @ts-ignore
import brokerLogo from "./broker.png";
import AdminPanel from "./components/admin/AdminPanel";

export default function App() {
  const {
    currentUser,
    loadingUser,
    loadingData,
    units,
    leads,
    transactions,
    refunds,
    walletBalance,
    isPremium,
    isSuperUser,
    selectedCountry,
    updateCountry,
    getActiveCountryConfig,
    formatCurrency,
    loginWithGoogle,
    logout,
    adjustWallet,
    subscribePremium,
    addUnit,
    updateUnit,
    deleteUnit,
    addLead,
    claimLead,
    clearAllLeads,
    clearAllData,
    requestRefund,
    loadingAuth,
    authError,
    clearAuthError
  } = useBrokerData();

  const [activeTab, setActiveTab] = useState<"chat" | "units" | "crm" | "history">("chat");
  
  // Secure dynamic gate to access Super Admin panel via URL query parameter (?admin=true)
  const [isAdminOpen, setIsAdminOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("admin") === "true";
    }
    return false;
  });

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("admin");
      window.history.replaceState({}, "", url.toString());
    }
  };


  // Create a brand new session/thread data specifically for this application load
  const [initialThreadData] = useState(() => {
    const id = `chat_${Date.now()}`;
    return {
      id,
      thread: {
        id,
        title: "New Property Chat",
        messages: [],
        extracted: { budget: "", propertyType: "", location: "", legalPapersRequired: null },
        qualification: null,
        qualificationValue: 0,
        leadSubmitted: false
      } as ChatThread
    };
  });

  // Load user-isolated conversation history from localStorage
  const storageKey = `broker_conversations_${currentUser?.uid || "anon"}`;
  
  const [conversations, setConversations] = useState<Record<string, ChatThread>>({});
  const [activeThreadId, setActiveThreadId] = useState<string>("");

  useEffect(() => {
    if (loadingUser) return;
    const currentKey = `broker_conversations_${currentUser?.uid || "anon"}`;
    const saved = localStorage.getItem(currentKey);
    let parsed: Record<string, ChatThread> = {};
    if (saved) {
      try { 
        parsed = JSON.parse(saved); 
      } catch (e) { 
        console.error(e); 
      }
    }
    
    // Always ensure a default thread exists
    const threadKeys = Object.keys(parsed);
    if (threadKeys.length === 0) {
      const startId = `chat_${Date.now()}`;
      parsed[startId] = {
        id: startId,
        title: "New Property Chat",
        messages: [],
        extracted: { budget: "", propertyType: "", location: "", legalPapersRequired: null },
        qualification: null,
        qualificationValue: 0,
        leadSubmitted: false
      };
      setActiveThreadId(startId);
    } else {
      setActiveThreadId(threadKeys[0]);
    }

    setConversations(parsed);
  }, [currentUser?.uid, loadingUser]);

  useEffect(() => {
    if (loadingUser || !currentUser) return;
    const currentKey = `broker_conversations_${currentUser.uid}`;
    if (Object.keys(conversations).length > 0) {
      localStorage.setItem(currentKey, JSON.stringify(conversations));
    }
  }, [conversations, currentUser?.uid, loadingUser]);

  useEffect(() => {
    if (activeThreadId) {
      localStorage.setItem(`broker_active_thread_${currentUser?.uid || "anon"}`, activeThreadId);
    }
  }, [activeThreadId, currentUser?.uid]);

  const [chatKey, setChatKey] = useState(0);
  const [showRoleAlert, setShowRoleAlert] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // New Chat handler that creates a fresh empty conversation thread
  const startNewChat = () => {
    const newId = `chat_${Date.now()}`;
    const newThread: ChatThread = {
      id: newId,
      title: "New Property Chat",
      messages: [],
      extracted: { budget: "", propertyType: "", location: "", legalPapersRequired: null },
      qualification: null,
      qualificationValue: 0,
      leadSubmitted: false
    };
    
    setConversations(prev => ({
      ...prev,
      [newId]: newThread
    }));
    setActiveThreadId(newId);
    setChatKey(prev => prev + 1);
    setActiveTab("chat");
    setIsSidebarOpen(false);
  };

  // Recharge trigger
  const handleRecharge = async (amount: number, method: any) => {
    await adjustWallet(amount, "credit", `Wallet Recharge via ${method.toUpperCase()}`, method);
  };

  if (loadingUser) {
    return (
      <div className="w-full h-screen bg-[#050505] flex flex-col items-center justify-center font-sans text-white">
        <div className="text-center space-y-5 relative">
          <div className="absolute -inset-10 bg-white/5 rounded-full blur-2xl animate-pulse" />
          <div className="w-14 h-14 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto relative z-10" />
          <p className="text-xs uppercase font-black tracking-widest text-slate-300 animate-pulse relative z-10 font-mono">Loading Unified Broker Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen custom-app-bg font-sans text-slate-100 relative overflow-hidden flex flex-col p-0">
      
      {/* Dynamic Slide-out Sidebar Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            key="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 cursor-pointer"
          />
        )}
        {isSidebarOpen && (
          <motion.div
            key="sidebar-content"
            initial={{ x: "-100%", opacity: 0.95 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#0d0d0d]/95 backdrop-blur-xl border-r border-white/[0.08] p-6 flex flex-col z-50 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8 select-none">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-black tracking-wider uppercase font-sans text-white">Broker AI</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">Workspace</span>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer active:scale-95"
              >
                <X size={16} />
              </button>
            </div>

            {/* Sidebar items - STRICTLY CRM, new chat, and chat history ONLY with Liquid Glass design */}
            <div className="flex-1 flex flex-col justify-start space-y-5 pt-2 items-center">
              {/* New Chat Button */}
              <div className="w-full flex justify-center">
                <LiquidMetalButton
                  width={232}
                  label="New Chat"
                  icon={<Plus size={16} />}
                  onClick={startNewChat}
                />
              </div>

              {/* CRM Tab Button */}
              <div className="w-full flex justify-center">
                <LiquidMetalButton
                  width={232}
                  label="CRM / Dashboard"
                  icon={<Users size={16} />}
                  onClick={() => {
                    setActiveTab("crm");
                    setIsSidebarOpen(false);
                  }}
                />
              </div>

              {/* Chat History Tab Button */}
              <div className="w-full flex justify-center">
                <LiquidMetalButton
                  width={232}
                  label="Chat History"
                  icon={<History size={16} />}
                  onClick={() => {
                    setActiveTab("history");
                    setIsSidebarOpen(false);
                  }}
                />
              </div>

              {/* Admin Panel Button (Super Admin Only) */}
              {isSuperUser && (
                <div className="w-full flex justify-center">
                  <LiquidMetalButton
                    width={232}
                    label="Admin Panel"
                    icon={<ShieldAlert size={16} className="text-amber-400" />}
                    onClick={() => {
                      setIsAdminOpen(true);
                      setIsSidebarOpen(false);
                      if (typeof window !== "undefined") {
                        const url = new URL(window.location.href);
                        url.searchParams.set("admin", "true");
                        window.history.replaceState({}, "", url.toString());
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* User Profile & Auth Session Module */}
            <div className="mt-auto pt-4 border-t border-white/[0.05] space-y-3.5 select-none text-left">
              {currentUser && currentUser.uid !== "guest_broker_user" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-2">
                    {currentUser.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt={currentUser.displayName || "User"} 
                        className="w-9 h-9 rounded-full border border-white/10 object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center font-bold text-xs text-white">
                        {(currentUser.displayName || currentUser.email || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {currentUser.displayName || "Authenticated User"}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate font-mono">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      logout();
                      setIsSidebarOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 font-bold text-xs cursor-pointer active:scale-98 transition-all"
                  >
                    <LogOut size={14} />
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="px-1 py-2 flex justify-center">
                  <button
                    onClick={async () => {
                      await loginWithGoogle();
                      setIsSidebarOpen(false);
                    }}
                    disabled={loadingAuth}
                    className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] text-white border border-white/[0.08] hover:border-white/[0.15] cursor-pointer active:scale-[0.98] transition-all backdrop-blur-md shadow-lg disabled:opacity-50"
                    title="Sign in with Google"
                  >
                    {loadingAuth ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span className="text-[11px] font-medium text-slate-400">Signing In...</span>
                      </div>
                    ) : (
                      <>
                        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.986 0-.74-.08-1.304-.176-1.859H12.24z" />
                        </svg>
                        <span className="text-xs font-bold text-white">Login with Google</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="text-center mt-4 pt-4 border-t border-white/[0.05]">
              <p className="text-[8px] text-slate-500 font-bold tracking-widest font-mono uppercase">Broker Portal Command Center</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Core View Area - full width and height as requested */}
      <div className="w-full h-full flex-1 flex flex-col z-10 relative overflow-hidden">
        
        {/* Sleek Minimal App Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] select-none shrink-0 bg-[#050505]/95 backdrop-blur-md z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="glass-icon p-2 rounded-xl cursor-pointer"
              title="Menu"
            >
              <Menu size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider uppercase font-mono text-white">
              Broker Portal
            </span>
          </div>
        </header>
        
        {/* CORE VIEWS RENDER STAGE - Displays views conditionally */}
        <main className="flex-1 w-full h-full flex flex-col relative overflow-hidden">
          {authError && (
            <div className="mx-6 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-center justify-between gap-3 shadow-lg select-none">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-red-400 shrink-0" />
                <span>{authError}</span>
              </div>
              <button 
                onClick={clearAuthError}
                className="text-red-400 hover:text-white transition cursor-pointer font-bold px-2 py-1 hover:bg-white/5 rounded-lg text-[10px]"
              >
                Dismiss
              </button>
            </div>
          )}
          {activeTab === "chat" ? (
            <AIChat 
              key={chatKey} 
              units={units}
              currentUser={currentUser}
              selectedCountry={selectedCountry}
              formatCurrency={formatCurrency}
              onLeadGenerated={addLead} 
              onLogoClick={() => setIsSidebarOpen(true)}
              conversations={conversations}
              setConversations={setConversations}
              activeThreadId={activeThreadId}
              setActiveThreadId={setActiveThreadId}
            />
          ) : activeTab === "crm" ? (
            <div className="flex-1 w-full h-full relative overflow-hidden bg-[#050505]">
              <BrokerCRM
                isPremium={isPremium}
                isSuperUser={isSuperUser}
                walletBalance={walletBalance}
                leads={leads}
                refunds={refunds}
                onSubscribe={subscribePremium}
                onClaimLead={claimLead}
                onRequestRefund={requestRefund}
                formatCurrency={formatCurrency}
                onAddUnit={addUnit}
                onUpdateUnit={updateUnit}
                onDeleteUnit={deleteUnit}
                onAddLead={addLead}
                onClearAllLeads={clearAllLeads}
                onClearAllData={clearAllData}
                units={units}
                currentUser={currentUser}
                onOpenChat={() => setActiveTab("chat")}
                onLogout={logout}
              />
            </div>
          ) : activeTab === "history" ? (
            <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden bg-[#050505]">
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <div className="max-w-4xl w-full mx-auto space-y-6">
                  <div className="text-left space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-widest font-mono">
                      <History size={14} className="text-white/40" />
                      Saved Conversations
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Property Conversations History</h2>
                    <p className="text-sm text-slate-400">Track and manage your past broker real-estate assistant sessions.</p>
                  </div>

                  {(() => {
                    const activeChatsList = (Object.entries(conversations) as [string, ChatThread][])
                      .filter(([_, chat]) => chat && chat.messages && chat.messages.length > 0);

                    if (activeChatsList.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border border-white/[0.05] bg-white/[0.01]">
                          <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center text-slate-500 mb-4 border border-white/[0.05]">
                            <History size={28} />
                          </div>
                          <h3 className="text-lg font-bold text-white mb-2">No Chat History</h3>
                          <p className="text-sm text-slate-400 max-w-sm mb-6">
                            Start a new conversation with Broker AI to analyze property requirements and budget metrics.
                          </p>
                          <button
                            onClick={startNewChat}
                            className="bg-white text-slate-950 font-bold text-xs px-6 py-3 rounded-xl hover:bg-slate-200 transition-all cursor-pointer active:scale-95"
                          >
                            Start a Chat Now
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeChatsList.map(([id, chat], index) => {
                          const chatMsgs = chat.messages || [];
                          const lastMsg = chatMsgs[chatMsgs.length - 1]?.content || "Empty Chat";
                          const formattedMsg = lastMsg.length > 80 ? lastMsg.substring(0, 80) + "..." : lastMsg;
                          
                          return (
                            <div 
                              key={id || chat.id || `chat-${index}`}
                              className="group p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.15] hover:shadow-[0_4px_20px_rgba(255,255,255,0.02)] transition-all flex flex-col justify-between space-y-4"
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <h3 className="text-base font-bold text-slate-100 group-hover:text-white transition-colors line-clamp-1">
                                    {chat.title}
                                  </h3>
                                  
                                  {chat.qualification && (
                                    <span className={cn(
                                      "text-[10px] font-black uppercase tracking-wider font-mono px-2 py-0.5 rounded-full border shrink-0",
                                      chat.qualification === "hot" && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                                      chat.qualification === "warm" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                      chat.qualification === "cold" && "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    )}>
                                      {chat.qualification}
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed text-left font-sans" dir="auto">
                                  {formattedMsg}
                                </p>

                                {/* Extracted Badges */}
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {chat.extracted?.budget && (
                                    <span className="text-[10px] font-semibold bg-white/[0.04] border border-white/[0.06] text-slate-300 px-2 py-0.5 rounded-md">
                                      💰 {chat.extracted.budget}
                                    </span>
                                  )}
                                  {chat.extracted?.location && (
                                    <span className="text-[10px] font-semibold bg-white/[0.04] border border-white/[0.06] text-slate-300 px-2 py-0.5 rounded-md">
                                      📍 {chat.extracted.location}
                                    </span>
                                  )}
                                  {chat.extracted?.propertyType && (
                                    <span className="text-[10px] font-semibold bg-white/[0.04] border border-white/[0.06] text-slate-300 px-2 py-0.5 rounded-md">
                                      🏢 {chat.extracted.propertyType}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] shrink-0">
                                <span className="text-[10px] font-mono text-slate-500 font-bold">
                                  {chat.messages.length} messages
                                </span>

                                <div className="flex items-center gap-2">
                                  {/* Delete Chat */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const updated = { ...conversations };
                                      delete updated[id];
                                      setConversations(updated);
                                      if (activeThreadId === id) {
                                        setActiveThreadId("current");
                                      }
                                    }}
                                    className="p-2 rounded-xl bg-transparent hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                                    title="Delete Conversation"
                                  >
                                    <Trash2 size={14} />
                                  </button>

                                  {/* Continue Chat */}
                                  <button
                                    onClick={() => {
                                      setActiveThreadId(id);
                                      setActiveTab("chat");
                                    }}
                                    className="px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white text-slate-300 hover:text-slate-950 border border-white/[0.1] hover:border-white transition-all text-xs font-bold cursor-pointer active:scale-95"
                                  >
                                    Continue
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden bg-[#050505]">
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <div className="max-w-7xl w-full mx-auto">
                  <UnitsManager
                    units={units}
                    onAddUnit={addUnit}
                    formatCurrency={formatCurrency}
                  />
                </div>
              </div>
            </div>
          )}
        </main>

      </div>

      {/* Super Admin Dashboard Overlay System */}
      {isAdminOpen && (
        <AdminPanel
          currentUser={currentUser}
          onClose={handleCloseAdmin}
          units={units}
          leads={leads}
          refunds={refunds}
          onAddUnit={addUnit}
          onUpdateUnit={updateUnit}
          onDeleteUnit={deleteUnit}
          onAddLead={addLead}
          onClaimLead={claimLead}
          onRequestRefund={requestRefund}
          onClearAllLeads={clearAllLeads}
          onClearAllData={clearAllData}
        />
      )}
    </div>
  );
}
