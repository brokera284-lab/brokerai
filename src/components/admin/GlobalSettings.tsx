import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { AdminAppSetting } from "./AdminTypes";
import { writeAdminLog } from "./adminLogger";
import { Settings, Save, Globe, Phone, FileText, ToggleLeft, ShieldAlert } from "lucide-react";

interface GlobalSettingsProps {
  currentUser: any;
}

const DEFAULT_SETTINGS: AdminAppSetting = {
  id: "system",
  leadPriceEgp: 500,
  premiumSubscriptionPriceEgp: 1500,
  maintenanceMode: false,
  registrationEnabled: true,
  aiFeaturesEnabled: true,
  platformFee: 10,
  featureLimits: {
    maxUnitsPerUser: 50,
    maxLeadsClaimedPerDay: 5
  },
  trialDuration: 14,
  discountValues: {
    premiumDiscountPercentage: 15,
    couponCode: "BROKER15"
  },
  contactInformation: {
    email: "brokera284@gmail.com",
    phone: "+20 100 123 4567",
    address: "Cairo, Egypt"
  },
  termsAndPolicies: "Terms and conditions of Broker AI Platform.",
  announcementBanner: "Welcome to the premium Broker AI Platform!",
  defaultPlatformConfig: "{}"
};

export default function GlobalSettings({ currentUser }: GlobalSettingsProps) {
  const [settings, setSettings] = useState<AdminAppSetting>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "settings", "system");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...snap.data() } as AdminAppSetting);
        } else {
          await setDoc(docRef, DEFAULT_SETTINGS);
          setSettings(DEFAULT_SETTINGS);
        }
      } catch (e) {
        console.error("Failed to load settings:", e);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      // Basic JSON validation for platform configuration
      if (settings.defaultPlatformConfig) {
        try {
          JSON.parse(settings.defaultPlatformConfig);
        } catch (err) {
          throw new Error("Default Platform Configuration must be a valid JSON string.");
        }
      }

      const docRef = doc(db, "settings", "system");
      const dataToSave = {
        ...settings,
        updatedAt: new Date().toISOString()
      };
      await setDoc(docRef, dataToSave);
      
      // Log admin action
      await writeAdminLog(
        currentUser?.uid || "admin",
        currentUser?.email || "brokera284@gmail.com",
        "settings_global_updated",
        `Updated global system switches (Maintenance: ${settings.maintenanceMode}, Registration: ${settings.registrationEnabled}, AI active: ${settings.aiFeaturesEnabled}).`,
        "settings/system"
      );

      setMessage({ text: "Global preferences updated and applied successfully!", type: "success" });
    } catch (e) {
      console.error("Save error:", e);
      setMessage({ text: "Failed to update global settings: " + (e instanceof Error ? e.message : String(e)), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof AdminAppSetting, val: any) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const updateContact = (key: keyof AdminAppSetting["contactInformation"], val: string) => {
    setSettings((prev) => ({
      ...prev,
      contactInformation: { ...prev.contactInformation, [key]: val }
    }));
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-slate-400">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto mb-4"></div>
        Loading global preferences...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="text-amber-500" size={22} />
          Global Platform & Network Preferences
        </h2>
        <p className="text-sm text-slate-400">
          Toggle maintenance locks, handle broker registration switches, and customize client assets.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm ${
          message.type === "success" 
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
            : "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module A: Strategic Feature Switches */}
        <div className="bg-slate-900/30 p-6 rounded-2xl border border-white/[0.05] space-y-5 md:col-span-1">
          <h3 className="text-sm font-semibold text-white border-b border-white/[0.05] pb-2 uppercase tracking-wider text-amber-500 flex items-center gap-2">
            <ToggleLeft size={16} />
            System Status Switches
          </h3>

          <div className="space-y-5">
            {/* Switch 1: Maintenance Mode */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-white/[0.03]">
              <div>
                <span className="block text-xs font-bold text-white uppercase tracking-wider">Maintenance Mode</span>
                <span className="text-[10px] text-slate-500">Lock general access to clients</span>
              </div>
              <button
                type="button"
                onClick={() => updateField("maintenanceMode", !settings.maintenanceMode)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.maintenanceMode ? "bg-red-500" : "bg-slate-700"
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.maintenanceMode ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>

            {/* Switch 2: Registration Enabled */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-white/[0.03]">
              <div>
                <span className="block text-xs font-bold text-white uppercase tracking-wider">Broker Registration</span>
                <span className="text-[10px] text-slate-500">Allow new broker signups</span>
              </div>
              <button
                type="button"
                onClick={() => updateField("registrationEnabled", !settings.registrationEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.registrationEnabled ? "bg-emerald-500" : "bg-slate-700"
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.registrationEnabled ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>

            {/* Switch 3: AI Copilot Enabled */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-white/[0.03]">
              <div>
                <span className="block text-xs font-bold text-white uppercase tracking-wider">AI Copilot Core</span>
                <span className="text-[10px] text-slate-500">Enable Gemini lead analysis</span>
              </div>
              <button
                type="button"
                onClick={() => updateField("aiFeaturesEnabled", !settings.aiFeaturesEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.aiFeaturesEnabled ? "bg-amber-500" : "bg-slate-700"
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.aiFeaturesEnabled ? "translate-x-5" : "translate-x-0"
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Module B: Client Identity and Contact Info */}
        <div className="bg-slate-900/30 p-6 rounded-2xl border border-white/[0.05] space-y-4 md:col-span-2">
          <h3 className="text-sm font-semibold text-white border-b border-white/[0.05] pb-2 uppercase tracking-wider text-amber-500 flex items-center gap-2">
            <Globe size={16} />
            Corporate Identity & Alerts
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">
                Primary System Announcement Banner
              </label>
              <input
                type="text"
                value={settings.announcementBanner}
                onChange={(e) => updateField("announcementBanner", e.target.value)}
                placeholder="Alert message displayed on header..."
                className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1.5">
                  Support Email Address
                </label>
                <input
                  type="email"
                  value={settings.contactInformation.email}
                  onChange={(e) => updateContact("email", e.target.value)}
                  className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1.5">
                  Support Telephone Lines
                </label>
                <input
                  type="text"
                  value={settings.contactInformation.phone}
                  onChange={(e) => updateContact("phone", e.target.value)}
                  className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">
                Corporate Headquarters Address
              </label>
              <input
                type="text"
                value={settings.contactInformation.address}
                onChange={(e) => updateContact("address", e.target.value)}
                className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                required
              />
            </div>
          </div>
        </div>

        {/* Module C: Policies & Dynamic Config */}
        <div className="bg-slate-900/30 p-6 rounded-2xl border border-white/[0.05] space-y-4 md:col-span-3">
          <h3 className="text-sm font-semibold text-white border-b border-white/[0.05] pb-2 uppercase tracking-wider text-amber-500 flex items-center gap-2">
            <FileText size={16} />
            Terms, Policies & Advanced JSON Config
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">
                Terms of Use & Legal Policies
              </label>
              <textarea
                value={settings.termsAndPolicies}
                onChange={(e) => updateField("termsAndPolicies", e.target.value)}
                rows={6}
                className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 font-mono text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">
                Default Platform Config Override (JSON Format)
              </label>
              <textarea
                value={settings.defaultPlatformConfig}
                onChange={(e) => updateField("defaultPlatformConfig", e.target.value)}
                rows={6}
                className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 font-mono text-xs"
                placeholder="{}"
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-amber-400 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
        >
          <Save size={16} />
          {saving ? "Saving Configuration..." : "Apply Global Configuration"}
        </button>
      </div>
    </form>
  );
}
