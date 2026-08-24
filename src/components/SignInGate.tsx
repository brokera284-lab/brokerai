import React from "react";
import { cn } from "../lib/utils";

interface SignInGateProps {
  type: "crm" | "history";
  onLogin: () => void;
  onReturnToChat: () => void;
  loadingAuth?: boolean;
  authError?: string | null;
  onClearAuthError?: () => void;
}

const BROKER_LOGO_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCzAzjcZGB7fdUij4_D0Zt0TGOYHlxtPp7d_9iyNTYo4HtplaQqZrQB7CE-FnkRZGm_KWusgZfo6E60SM9euwX9yA_4LZOlOzdxqd5bcKpFniN0qrlnHJ7g9Rb20Ol6du9QDalXh8voMN2-Ogt5s4n4zi2OEglJ7BBpFtlTtnW46qSnytMCbjDB65eSsndcmV8Ki-41hUz1p2-_XLp7X-JktxvcNioC2Icbqky6KHC0Z2k4SaAGngyk44PpEFKqKkaDtg";

export default function SignInGate({
  type,
  onLogin,
  onReturnToChat,
  loadingAuth = false,
  authError,
  onClearAuthError
}: SignInGateProps) {
  const isCRM = type === "crm";

  const benefits = isCRM
    ? [
        {
          icon: "dashboard",
          title: "Full CRM Pipeline",
          desc: "Manage properties, hot prospects, and claim verified buyer leads."
        },
        {
          icon: "cloud_sync",
          title: "Persistent Cloud Sync",
          desc: "Your inventory and transaction history safely saved in real time."
        },
        {
          icon: "verified_user",
          title: "Verified Broker Profile",
          desc: "Unlock premium tools, custom commission settings, and analytics."
        }
      ]
    : [
        {
          icon: "history",
          title: "Saved Chat Sessions",
          desc: "Access your property queries and assistant conversations anytime."
        },
        {
          icon: "devices",
          title: "Cross-Device Sync",
          desc: "Resume your broker assistant chats seamlessly on mobile or desktop."
        },
        {
          icon: "lock",
          title: "Private & Secure",
          desc: "All client briefs and extracted requirements tied to your account."
        }
      ];

  return (
    <div className="w-full h-full min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4 sm:p-6 bg-[#0A0A0A] text-[#e2e2e4]">
      <div className="w-full max-w-md mx-auto space-y-6">
        
        {/* Main Card */}
        <div className="bg-[#121212] border border-[#444748] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          
          {/* Subtle Top Glow Accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00D18E] to-transparent opacity-80" />

          {/* Header & Logo */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#1e2021] border border-[#444748] flex items-center justify-center mx-auto shadow-inner p-2">
              <img 
                src={BROKER_LOGO_URL} 
                alt="Broker AI" 
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.src = "/black.png"; }}
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D18E]/10 border border-[#00D18E]/20 text-[#00D18E] text-[11px] font-bold uppercase tracking-wider font-secondary">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              Sign-In Required
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {isCRM ? "Sign in to access CRM" : "Sign in to access History"}
            </h2>

            <p className="text-xs sm:text-sm text-[#c4c7c7] leading-relaxed">
              {isCRM
                ? "Connect your Google account to manage your property listings, claim verified buyer leads, and access real-time CRM analytics."
                : "Connect your Google account to save, synchronize, and resume past property conversations across all your devices."}
            </p>
          </div>

          {/* Auth Error Banner */}
          {authError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[#ffb4ab] text-xs flex items-center justify-between gap-2">
              <span className="leading-snug">{authError}</span>
              {onClearAuthError && (
                <button
                  onClick={onClearAuthError}
                  className="text-[#ffb4ab] hover:text-white font-bold text-[10px] uppercase px-1.5 py-0.5 rounded hover:bg-white/5 cursor-pointer shrink-0"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}

          {/* Key Benefits List */}
          <div className="space-y-3 pt-1">
            {benefits.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a]">
                <div className="w-8 h-8 rounded-lg bg-[#242424] flex items-center justify-center text-[#00D18E] shrink-0 border border-white/5">
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                </div>
                <div className="space-y-0.5 text-left min-w-0">
                  <p className="text-xs font-bold text-white truncate">{item.title}</p>
                  <p className="text-[11px] text-[#c4c7c7] leading-tight">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={onLogin}
              disabled={loadingAuth}
              className={cn(
                "w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-lg active:scale-98",
                "bg-white text-[#121212] hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loadingAuth ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  {/* Official Google 'G' Icon */}
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            <button
              onClick={onReturnToChat}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[#c4c7c7] hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-center"
            >
              Continue in Guest Mode (AI Chat)
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-center text-[#c4c7c7]/70">
          Protected by Google Firebase Authentication. Your real estate data remains strictly confidential.
        </p>

      </div>
    </div>
  );
}
