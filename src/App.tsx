import React, { useState } from "react";
import { useBrokerData } from "./lib/useBrokerData";
import { COUNTRIES } from "./lib/countries";
import AIChat from "./components/AIChat";
import UnitsManager from "./components/UnitsManager";
import BrokerCRM from "./components/BrokerCRM";
import { 
  Building2, Users, HelpCircle, LogOut, Sparkles, LogIn, ShieldAlert, CheckCircle2, Settings, X 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
    selectedCountry,
    updateCountry,
    getActiveCountryConfig,
    formatCurrency,
    loginWithGoogle,
    logout,
    adjustWallet,
    subscribePremium,
    addUnit,
    addLead,
    claimLead,
    requestRefund,
    loadingAuth,
    authError,
    clearAuthError
  } = useBrokerData();

  const [activeTab, setActiveTab] = useState<"chat" | "units" | "crm">("chat");
  const [chatKey, setChatKey] = useState(0);
  const [showRoleAlert, setShowRoleAlert] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Recharge trigger
  const handleRecharge = async (amount: number, method: any) => {
    await adjustWallet(amount, "credit", `Wallet Recharge via ${method.toUpperCase()}`, method);
  };

  if (loadingUser) {
    return (
      <div className="w-full h-screen bg-[#030308] flex flex-col items-center justify-center font-sans text-white">
        <div className="text-center space-y-5 relative">
          <div className="absolute -inset-10 bg-blue-500/10 rounded-full blur-2xl animate-pulse" />
          <div className="w-14 h-14 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto relative z-10" />
          <p className="text-xs uppercase font-black tracking-widest text-blue-400 animate-pulse relative z-10 font-mono">Initializing Broker AI engines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen custom-app-bg font-sans text-slate-100 relative overflow-hidden flex flex-col p-0">
      
      {/* Main Core View Area - full width and height as requested */}
      <div className="w-full h-full flex-1 flex flex-col z-10 relative overflow-hidden">
        
        {/* CORE VIEWS RENDER STAGE - Displays only the AI Chat */}
        <main className="flex-1 w-full h-full flex flex-col relative overflow-hidden">
          <AIChat 
            key={chatKey} 
            units={units}
            selectedCountry={selectedCountry}
            formatCurrency={formatCurrency}
            onLeadGenerated={addLead} 
          />
        </main>

      </div>
    </div>
  );
}
