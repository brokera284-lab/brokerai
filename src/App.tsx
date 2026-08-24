import React, { useState, useEffect } from "react";
import { useBrokerData } from "./lib/useBrokerData";
import AIChat from "./components/AIChat";
import UnitsManager from "./components/UnitsManager";
import BrokerCRM from "./components/BrokerCRM";
import SignInGate from "./components/SignInGate";
import { ChatThread } from "./types";
import { cn } from "./lib/utils";
import AdminPanel from "./components/admin/AdminPanel";

const BROKER_LOGO_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCzAzjcZGB7fdUij4_D0Zt0TGOYHlxtPp7d_9iyNTYo4HtplaQqZrQB7CE-FnkRZGm_KWusgZfo6E60SM9euwX9yA_4LZOlOzdxqd5bcKpFniN0qrlnHJ7g9Rb20Ol6du9QDalXh8voMN2-Ogt5s4n4zi2OEglJ7BBpFtlTtnW46qSnytMCbjDB65eSsndcmV8Ki-41hUz1p2-_XLp7X-JktxvcNioC2Icbqky6KHC0Z2k4SaAGngyk44PpEFKqKkaDtg";

export default function App() {
  const {
    currentUser,
    loadingUser,
    units,
    leads,
    refunds,
    walletBalance,
    isPremium,
    isSuperUser,
    selectedCountry,
    formatCurrency,
    loginWithGoogle,
    logout,
    subscribePremium,
    addUnit,
    updateUnit,
    deleteUnit,
    addLead,
    claimLead,
    deleteLead,
    clearAllLeads,
    clearAllData,
    requestRefund,
    loadingAuth,
    authError,
    clearAuthError
  } = useBrokerData();

  const [activeTab, setActiveTab] = useState<"chat" | "units" | "crm" | "history">("chat");
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768;
    }
    return true;
  });
  
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

  const [conversations, setConversations] = useState<Record<string, ChatThread>>({});
  const [activeThreadId, setActiveThreadId] = useState<string>("");
  const [chatKey, setChatKey] = useState(0);

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
    
    // Preserve all existing chats with messages for the Chat History archive
    const existingHistory: Record<string, ChatThread> = {};
    for (const [id, chat] of Object.entries(parsed)) {
      if (chat && chat.messages && chat.messages.length > 0) {
        existingHistory[id] = chat;
      }
    }
    
    // Every refresh opens a fresh new chat immediately
    const freshChatId = `chat_${Date.now()}`;
    const freshThread: ChatThread = {
      id: freshChatId,
      title: "New Property Chat",
      messages: [],
      extracted: { budget: "", propertyType: "", location: "", legalPapersRequired: null },
      qualification: null,
      qualificationValue: 0,
      leadSubmitted: false
    };

    existingHistory[freshChatId] = freshThread;
    setActiveThreadId(freshChatId);
    setConversations(existingHistory);
    // Persist immediately
    localStorage.setItem(currentKey, JSON.stringify(existingHistory));
  }, [currentUser?.uid, loadingUser]);

  useEffect(() => {
    if (loadingUser) return;
    const currentKey = `broker_conversations_${currentUser?.uid || "anon"}`;
    if (Object.keys(conversations).length > 0) {
      localStorage.setItem(currentKey, JSON.stringify(conversations));
    }
  }, [conversations, currentUser?.uid, loadingUser]);

  useEffect(() => {
    if (activeThreadId) {
      localStorage.setItem(`broker_active_thread_${currentUser?.uid || "anon"}`, activeThreadId);
    }
  }, [activeThreadId, currentUser?.uid]);

  // Helper to switch tabs and close sidebar only on mobile
  const handleNavTab = (tab: "chat" | "units" | "crm" | "history") => {
    setActiveTab(tab);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // New Chat handler that creates a fresh empty conversation thread while saving history
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
    
    setConversations(prev => {
      const updated: Record<string, ChatThread> = {};
      for (const [id, chat] of Object.entries(prev) as [string, ChatThread][]) {
        if (chat && chat.messages && chat.messages.length > 0) {
          updated[id] = chat;
        }
      }
      updated[newId] = newThread;
      return updated;
    });
    setActiveThreadId(newId);
    setChatKey(prev => prev + 1);
    setActiveTab("chat");
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="w-full h-screen bg-[#0A0A0A] flex flex-col items-center justify-center font-sans text-[#e2e2e4]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-[#00D18E]/20 border-t-[#00D18E] rounded-full animate-spin mx-auto" />
          <p className="text-[12px] uppercase font-secondary tracking-widest text-[#c4c7c7] animate-pulse">
            Loading Workspace...
          </p>
        </div>
      </div>
    );
  }

  const isAuthUser = Boolean(currentUser && currentUser.uid !== "guest_broker_user");

  if (activeTab === "crm") {
    if (!isAuthUser) {
      return (
        <div className="bg-[#0A0A0A] text-[#e2e2e4] h-screen w-full max-w-full overflow-hidden font-sans flex flex-col">
          {/* Top Minimal Navigation Bar */}
          <header className="flex justify-between items-center h-16 px-4 md:px-8 bg-[#121212] border-b border-[#444748] shrink-0 z-10 w-full">
            <button
              onClick={() => setActiveTab("chat")}
              className="flex items-center gap-3 cursor-pointer text-left group p-1 -ml-1 rounded-xl hover:bg-white/5 transition-colors"
            >
              <img 
                alt="Broker AI Logo" 
                className="w-8 h-8 object-contain transition-transform group-hover:scale-105" 
                src={BROKER_LOGO_URL}
                onError={(e) => { e.currentTarget.src = "/black.png"; }}
              />
              <div>
                <h1 className="text-[16px] font-semibold uppercase tracking-wider text-[#e2e2e4]">BROKER AI</h1>
                <p className="font-secondary text-[10px] tracking-[0.1em] text-[#c4c7c7]">CRM WORKSPACE</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("chat")}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#00D18E] bg-[#00D18E]/10 border border-[#00D18E]/20 px-3.5 py-1.5 rounded-full active:scale-95 cursor-pointer hover:bg-[#00D18E]/20 transition-all min-h-[36px]"
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              <span>Back to AI Chat</span>
            </button>
          </header>

          <main className="flex-1 overflow-y-auto w-full">
            <SignInGate
              type="crm"
              onLogin={loginWithGoogle}
              onReturnToChat={() => setActiveTab("chat")}
              loadingAuth={loadingAuth}
              authError={authError}
              onClearAuthError={clearAuthError}
            />
          </main>
        </div>
      );
    }

    return (
      <div className="bg-[#0A0A0A] text-[#e2e2e4] h-screen w-full max-w-full overflow-hidden font-sans">
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
          onDeleteLead={deleteLead}
          onClearAllLeads={clearAllLeads}
          onClearAllData={clearAllData}
          units={units}
          currentUser={currentUser}
          onOpenChat={() => setActiveTab("chat")}
          onLogout={logout}
          onLogin={loginWithGoogle}
          loadingAuth={loadingAuth}
        />

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

  return (
    <div className="bg-[#0A0A0A] text-[#e2e2e4] min-h-screen flex font-sans overflow-x-hidden relative">
      
      {/* SideNavBar (Desktop only, hidden on mobile) */}
      <nav 
        className={cn(
          "hidden md:flex fixed left-0 top-0 h-full w-[263px] border-r border-[#444748] bg-[#121212] flex-col gap-6 p-6 z-50 transition-transform duration-300 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ width: "263px" }}
      >
        {/* Brand Logo Area & Close Toggle */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="flex items-center gap-3 cursor-pointer text-left group p-1 -ml-1 rounded-xl hover:bg-white/5 transition-colors w-full"
            title="Collapse sidebar"
          >
            <img 
              alt="Broker AI Logo" 
              className="w-10 h-10 object-contain transition-transform group-hover:scale-105" 
              src={BROKER_LOGO_URL}
              onError={(e) => { e.currentTarget.src = "/black.png"; }}
            />
            <div>
              <h1 className="text-[20px] font-semibold uppercase tracking-wider text-[#e2e2e4]">BROKER AI</h1>
              <p className="font-secondary text-[12px] tracking-[0.1em] text-[#c4c7c7]">WORKSPACE</p>
            </div>
          </button>
        </div>

        {/* Navigation Links */}
        <ul className="flex flex-col gap-2 flex-grow">
          {/* Active / Inactive: New Chat */}
          <li>
            <button 
              onClick={startNewChat}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-lg font-medium transition-all text-left cursor-pointer",
                activeTab === "chat" 
                  ? "text-[#00D18E] bg-[#00D18E]/10" 
                  : "text-[#c4c7c7] hover:text-[#e2e2e4] hover:bg-[#333537]"
              )}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === "chat" ? "'FILL' 1" : "'FILL' 0" }}>add</span>
              <span className="text-[14px]">New Chat</span>
            </button>
          </li>

          {/* CRM Dashboard */}
          <li>
            <button 
              onClick={() => handleNavTab("crm")}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-lg font-medium transition-all text-left cursor-pointer",
                activeTab === "crm" 
                  ? "text-[#00D18E] bg-[#00D18E]/10" 
                  : "text-[#c4c7c7] hover:text-[#e2e2e4] hover:bg-[#333537]"
              )}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === "crm" ? "'FILL' 1" : "'FILL' 0" }}>dashboard</span>
              <span className="text-[14px]">CRM Dashboard</span>
            </button>
          </li>

          {/* History */}
          <li>
            <button 
              onClick={() => handleNavTab("history")}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-lg font-medium transition-all text-left cursor-pointer",
                activeTab === "history" 
                  ? "text-[#00D18E] bg-[#00D18E]/10" 
                  : "text-[#c4c7c7] hover:text-[#e2e2e4] hover:bg-[#333537]"
              )}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === "history" ? "'FILL' 1" : "'FILL' 0" }}>history</span>
              <span className="text-[14px]">History</span>
            </button>
          </li>
        </ul>

        {/* Footer Actions */}
        <div className="mt-auto border-t border-[#444748]/30 pt-6 flex flex-col gap-2">
          {currentUser?.email?.toLowerCase() === "brokera284@gmail.com" && (
            <button 
              onClick={() => {
                setIsAdminOpen(true);
                if (typeof window !== "undefined" && window.innerWidth < 768) {
                  setIsSidebarOpen(false);
                }
              }}
              className="w-full flex items-center gap-4 p-4 rounded-lg text-[#c4c7c7] hover:text-[#e2e2e4] hover:bg-[#333537] transition-colors text-left cursor-pointer"
            >
              <span className="material-symbols-outlined">settings</span>
              <span className="text-[14px]">Broker Portal Command Center</span>
            </button>
          )}

          {currentUser && currentUser.uid !== "guest_broker_user" ? (
            <button 
              onClick={() => {
                logout();
                if (typeof window !== "undefined" && window.innerWidth < 768) {
                  setIsSidebarOpen(false);
                }
              }}
              className="flex items-center gap-4 p-4 rounded-lg text-[#ffb4ab] hover:bg-[#93000a]/10 transition-colors text-left w-full cursor-pointer"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="text-[14px]">Log Out ({currentUser.displayName?.split(" ")[0] || "User"})</span>
            </button>
          ) : (
            <button 
              onClick={async () => {
                await loginWithGoogle();
                if (typeof window !== "undefined" && window.innerWidth < 768) {
                  setIsSidebarOpen(false);
                }
              }}
              disabled={loadingAuth}
              className="flex items-center gap-4 p-4 rounded-lg text-[#00D18E] hover:bg-[#00D18E]/10 transition-colors text-left w-full cursor-pointer"
            >
              <span className="material-symbols-outlined">login</span>
              <span className="text-[14px]">{loadingAuth ? "Signing in..." : "Log In"}</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Canvas */}
      <main 
        className={cn(
          "flex-grow w-full min-h-screen flex flex-col relative bg-[#0A0A0A] transition-all duration-300 ease-in-out",
          isSidebarOpen ? "md:ml-[263px]" : "ml-0"
        )}
      >
        
        {/* TopAppBar with Logo Toggle Button without duplication */}
        <header className="w-full h-[69px] flex justify-between items-center px-4 md:px-6 bg-transparent sticky top-0 z-40" style={{ height: "69px" }}>
          <div className="flex items-center gap-3">
            {/* Desktop toggle vs Mobile brand mark */}
            <button 
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth >= 768) {
                  setIsSidebarOpen(prev => !prev);
                }
              }}
              className="flex items-center p-1.5 -ml-1.5 rounded-xl hover:bg-white/5 transition-all cursor-pointer group"
              title="Broker AI"
            >
              <img 
                alt="Broker AI Logo" 
                className="w-8 h-8 object-contain transition-transform group-hover:scale-105" 
                src={BROKER_LOGO_URL}
                onError={(e) => { e.currentTarget.src = "/black.png"; }}
              />
            </button>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div 
              onClick={() => {
                if (!currentUser || currentUser.uid === "guest_broker_user") {
                  loginWithGoogle();
                } else {
                  setActiveTab("crm");
                }
              }}
              className="w-8 h-8 rounded-full bg-[#333537] border border-[#444748] overflow-hidden cursor-pointer hover:border-[#00D18E] transition-colors flex items-center justify-center"
              title={currentUser?.displayName || "Profile"}
            >
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="material-symbols-outlined text-[#c4c7c7] text-[18px]">person</span>
              )}
            </div>
          </div>
        </header>

        {/* View Switcher */}
        {authError && (
          <div className="mx-4 md:mx-6 mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-[#ffb4ab] text-xs flex items-center justify-between gap-3 select-none">
            <span>{authError}</span>
            <button 
              onClick={clearAuthError}
              className="text-[#ffb4ab] hover:text-white transition cursor-pointer font-bold px-2 py-1 hover:bg-white/5 rounded-lg text-[10px]"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex-1 flex flex-col w-full pb-20 md:pb-0">
          {activeTab === "chat" ? (
            <AIChat 
              key={chatKey} 
              units={units}
              currentUser={currentUser}
              selectedCountry={selectedCountry}
              formatCurrency={formatCurrency}
              onLeadGenerated={addLead} 
              onLogoClick={() => setIsSidebarOpen(prev => !prev)}
              conversations={conversations}
              setConversations={setConversations}
              activeThreadId={activeThreadId}
              setActiveThreadId={setActiveThreadId}
              onNewChat={startNewChat}
            />
          ) : activeTab === "history" ? (
            !isAuthUser ? (
              <SignInGate
                type="history"
                onLogin={loginWithGoogle}
                onReturnToChat={() => setActiveTab("chat")}
                loadingAuth={loadingAuth}
                authError={authError}
                onClearAuthError={clearAuthError}
              />
            ) : (
              <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden bg-[#0A0A0A] p-4 md:p-6">
                <div className="max-w-4xl w-full mx-auto space-y-6">
                  <div className="text-left space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#c4c7c7] font-bold uppercase tracking-widest font-secondary">
                      <span className="material-symbols-outlined text-[16px]">history</span>
                      Saved Conversations
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-[#e2e2e4] tracking-tight">Property Conversations History</h2>
                    <p className="text-xs md:text-sm text-[#c4c7c7]">Track and manage your past broker real-estate assistant sessions.</p>
                  </div>

                  {(() => {
                    const activeChatsList = (Object.entries(conversations) as [string, ChatThread][])
                      .filter(([_, chat]) => chat && chat.messages && chat.messages.length > 0);

                    if (activeChatsList.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-[#444748] bg-[#121212]">
                          <div className="w-16 h-16 rounded-full bg-[#1e2021] flex items-center justify-center text-[#c4c7c7] mb-4 border border-[#444748]">
                            <span className="material-symbols-outlined text-[32px]">history</span>
                          </div>
                          <h3 className="text-lg font-bold text-[#e2e2e4] mb-2">No Chat History</h3>
                          <p className="text-sm text-[#c4c7c7] max-w-sm mb-6">
                            Start a new conversation with Broker AI to analyze property requirements and budget metrics.
                          </p>
                          <button
                            onClick={startNewChat}
                            className="bg-[#00D18E] text-[#0A0A0A] font-bold text-xs px-6 py-3 rounded-lg hover:bg-[#00D18E]/90 transition-all cursor-pointer active:scale-95"
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
                              className="group p-4 md:p-5 rounded-xl border border-[#444748] bg-[#121212] hover:bg-[#1e2021] hover:border-[#00D18E]/40 transition-all flex flex-col justify-between space-y-4"
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <h3 className="text-sm md:text-base font-bold text-[#e2e2e4] group-hover:text-[#00D18E] transition-colors line-clamp-1">
                                    {chat.title}
                                  </h3>
                                  
                                  {chat.qualification && (
                                    <span className={cn(
                                      "text-[10px] font-bold uppercase tracking-wider font-secondary px-2 py-0.5 rounded border shrink-0",
                                      chat.qualification === "hot" && "bg-rose-500/10 text-rose-400 border-rose-500/20",
                                      chat.qualification === "warm" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                                      chat.qualification === "cold" && "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    )}>
                                      {chat.qualification}
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-[#c4c7c7] line-clamp-2 leading-relaxed text-left font-sans">
                                  {formattedMsg}
                                </p>

                                {/* Extracted Badges */}
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {chat.extracted?.budget && (
                                    <span className="text-[10px] font-medium bg-[#1e2021] border border-[#444748] text-[#c4c7c7] px-2 py-0.5 rounded">
                                      💰 {chat.extracted.budget}
                                    </span>
                                  )}
                                  {chat.extracted?.location && (
                                    <span className="text-[10px] font-medium bg-[#1e2021] border border-[#444748] text-[#c4c7c7] px-2 py-0.5 rounded">
                                      📍 {chat.extracted.location}
                                    </span>
                                  )}
                                  {chat.extracted?.propertyType && (
                                    <span className="text-[10px] font-medium bg-[#1e2021] border border-[#444748] text-[#c4c7c7] px-2 py-0.5 rounded">
                                      🏢 {chat.extracted.propertyType}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t border-[#444748]/30 shrink-0">
                                <span className="text-[10px] font-secondary text-[#c4c7c7]">
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
                                    className="p-2 rounded-lg bg-transparent hover:bg-rose-500/10 text-[#c4c7c7] hover:text-rose-400 transition-all cursor-pointer active:scale-95"
                                    title="Delete Conversation"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                  </button>

                                  {/* Continue Chat */}
                                  <button
                                    onClick={() => {
                                      setActiveThreadId(id);
                                      setActiveTab("chat");
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-[#1e2021] hover:bg-[#00D18E] text-[#e2e2e4] hover:text-[#0A0A0A] border border-[#444748] hover:border-[#00D18E] transition-all text-xs font-semibold cursor-pointer active:scale-95"
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
            )
          ) : (
            <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden bg-[#0A0A0A] p-4 md:p-6">
              <div className="max-w-7xl w-full mx-auto">
                <UnitsManager
                  units={units}
                  onAddUnit={addUnit}
                  formatCurrency={formatCurrency}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile App Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121212]/95 backdrop-blur-xl border-t border-[#444748]/50 pb-safe px-3 py-1.5 flex items-center justify-around select-none shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
          <button
            onClick={() => handleNavTab("chat")}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer active:scale-90",
              activeTab === "chat" ? "text-[#00D18E]" : "text-[#c4c7c7] hover:text-white"
            )}
          >
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: activeTab === "chat" ? "'FILL' 1" : "'FILL' 0" }}>chat</span>
            <span className="text-[10px] font-medium tracking-tight mt-0.5">Chat</span>
          </button>

          <button
            onClick={() => handleNavTab("crm")}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer active:scale-90",
              activeTab === "crm" ? "text-[#00D18E]" : "text-[#c4c7c7] hover:text-white"
            )}
          >
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: activeTab === "crm" ? "'FILL' 1" : "'FILL' 0" }}>dashboard</span>
            <span className="text-[10px] font-medium tracking-tight mt-0.5">CRM</span>
          </button>

          <button
            onClick={startNewChat}
            className="flex flex-col items-center justify-center -mt-4 cursor-pointer active:scale-90 group"
          >
            <div className="w-11 h-11 rounded-full bg-[#00D18E] text-[#0A0A0A] flex items-center justify-center shadow-lg shadow-[#00D18E]/25 transition-transform group-hover:scale-105 border-2 border-[#0A0A0A]">
              <span className="material-symbols-outlined text-[24px] font-bold">add</span>
            </div>
            <span className="text-[10px] font-bold text-[#00D18E] tracking-tight mt-1">New</span>
          </button>

          <button
            onClick={() => handleNavTab("history")}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer active:scale-90",
              activeTab === "history" ? "text-[#00D18E]" : "text-[#c4c7c7] hover:text-white"
            )}
          >
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: activeTab === "history" ? "'FILL' 1" : "'FILL' 0" }}>history</span>
            <span className="text-[10px] font-medium tracking-tight mt-0.5">History</span>
          </button>
        </nav>
      </main>

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

