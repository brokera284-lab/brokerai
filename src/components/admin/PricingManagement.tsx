import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { AdminAppSetting } from "./AdminTypes";
import { writeAdminLog } from "./adminLogger";
import { DollarSign, Save, ShieldAlert, Key, Percent, HelpCircle, ArrowRight } from "lucide-react";

interface PricingManagementProps {
  currentUser: any;
  formatCurrency: (val: number) => string;
}

const DEFAULT_SETTINGS: AdminAppSetting = {
  id: "system",
  leadPriceEgp: 500,
  premiumSubscriptionPriceEgp: 1500,
  maintenanceMode: false,
  registrationEnabled: true,
  aiFeaturesEnabled: true,
  platformFee: 10, // percentage or fixed
  featureLimits: {
    maxUnitsPerUser: 50,
    maxLeadsClaimedPerDay: 5
  },
  trialDuration: 14, // in days
  discountValues: {
    premiumDiscountPercentage: 15,
    couponCode: "BROKER15"
  },
  contactInformation: {
    email: "brokera284@gmail.com",
    phone: "+20 100 123 4567",
    address: "Cairo, Egypt"
  },
  termsAndPolicies: "Terms and conditions are managed globally.",
  announcementBanner: "Welcome to the premium Broker AI Platform!",
  defaultPlatformConfig: "{}"
};

export default function PricingManagement({ currentUser, formatCurrency }: PricingManagementProps) {
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
          // Initialize if empty
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
        "settings_pricing_updated",
        `Updated pricing variables: Premium cost to ${settings.premiumSubscriptionPriceEgp} EGP, Lead cost to ${settings.leadPriceEgp} EGP.`,
        "settings/system"
      );

      setMessage({ text: "Pricing variables updated and synced successfully!", type: "success" });
    } catch (e) {
      console.error("Save error:", e);
      setMessage({ text: "Failed to update pricing variables: " + (e instanceof Error ? e.message : String(e)), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof AdminAppSetting, val: any) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
  };

  const updateFeatureLimit = (key: keyof AdminAppSetting["featureLimits"], val: number) => {
    setSettings((prev) => ({
      ...prev,
      featureLimits: { ...prev.featureLimits, [key]: val }
    }));
  };

  const updateDiscount = (key: keyof AdminAppSetting["discountValues"], val: any) => {
    setSettings((prev) => ({
      ...prev,
      discountValues: { ...prev.discountValues, [key]: val }
    }));
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-slate-400">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto mb-4"></div>
        Loading configuration variables...
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <DollarSign className="text-amber-500" size={22} />
          Centralized Pricing & Variable Management
        </h2>
        <p className="text-sm text-slate-400">
          Modify core subscription fees, qualification lead costs, and business limits globally.
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module A: Financial Constants */}
        <div className="bg-slate-900/30 p-6 rounded-2xl border border-white/[0.05] space-y-4">
          <h3 className="text-sm font-semibold text-white border-b border-white/[0.05] pb-2 uppercase tracking-wider text-amber-500">
            Core Financial Variables
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">
                Premium License Fee (Monthly, EGP)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">EGP</span>
                <input
                  type="number"
                  value={settings.premiumSubscriptionPriceEgp}
                  onChange={(e) => updateField("premiumSubscriptionPriceEgp", parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-white/[0.08] rounded-xl pl-12 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Currently displayed in user currency as: <span className="text-slate-300 font-mono font-bold">{formatCurrency(settings.premiumSubscriptionPriceEgp)}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">
                Qualified Lead Base Cost (EGP)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">EGP</span>
                <input
                  type="number"
                  value={settings.leadPriceEgp}
                  onChange={(e) => updateField("leadPriceEgp", parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-white/[0.08] rounded-xl pl-12 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Currently displayed in user currency as: <span className="text-slate-300 font-mono font-bold">{formatCurrency(settings.leadPriceEgp)}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">
                Platform Commission Fee (%)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">%</span>
                <input
                  type="number"
                  value={settings.platformFee}
                  onChange={(e) => updateField("platformFee", parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-white/[0.08] rounded-xl pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Module B: Feature Limits & Thresholds */}
        <div className="bg-slate-900/30 p-6 rounded-2xl border border-white/[0.05] space-y-4">
          <h3 className="text-sm font-semibold text-white border-b border-white/[0.05] pb-2 uppercase tracking-wider text-amber-500">
            System Feature Caps
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">
                Maximum Properties Upload Limit (Per Non-Premium User)
              </label>
              <input
                type="number"
                value={settings.featureLimits.maxUnitsPerUser}
                onChange={(e) => updateFeatureLimit("maxUnitsPerUser", parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">
                Max Qualified Leads Claim Limit (Per Broker Per Day)
              </label>
              <input
                type="number"
                value={settings.featureLimits.maxLeadsClaimedPerDay}
                onChange={(e) => updateFeatureLimit("maxLeadsClaimedPerDay", parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">
                Free Trial Account Duration (Days)
              </label>
              <input
                type="number"
                value={settings.trialDuration}
                onChange={(e) => updateField("trialDuration", parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                required
              />
            </div>
          </div>
        </div>

        {/* Module C: Coupons & Promotional Settings */}
        <div className="bg-slate-900/30 p-6 rounded-2xl border border-white/[0.05] space-y-4 md:col-span-2">
          <h3 className="text-sm font-semibold text-white border-b border-white/[0.05] pb-2 uppercase tracking-wider text-amber-500 flex items-center gap-2">
            <Percent size={16} />
            Promotions, Coupons & Discounts
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">
                Premium License Launch Discount Percentage (%)
              </label>
              <input
                type="number"
                value={settings.discountValues.premiumDiscountPercentage}
                onChange={(e) => updateDiscount("premiumDiscountPercentage", parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5">
                Active Promotional Coupon Code
              </label>
              <input
                type="text"
                value={settings.discountValues.couponCode || ""}
                onChange={(e) => updateDiscount("couponCode", e.target.value.toUpperCase())}
                placeholder="NO_COUPON"
                className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 uppercase font-mono"
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
          {saving ? "Saving Changes..." : "Apply Pricing Variables"}
        </button>
      </div>
    </form>
  );
}
