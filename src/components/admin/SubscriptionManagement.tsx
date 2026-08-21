import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { AdminUser, AdminSubscription, SubscriptionHistoryEntry } from "./AdminTypes";
import { writeAdminLog } from "./adminLogger";
import { Award, Search, Calendar, Play, Pause, XCircle, RefreshCw, Sparkles, CheckCircle2 } from "lucide-react";

interface SubscriptionManagementProps {
  currentUser: any;
  formatDate: (val: any) => string;
}

export default function SubscriptionManagement({ currentUser, formatDate }: SubscriptionManagementProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Form states for active operations
  const [extendDays, setExtendDays] = useState(30);
  const [customExpiryDate, setCustomExpiryDate] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const list: AdminUser[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          name: data.name || "Broker",
          email: data.email || "broker@example.com",
          role: data.role || "broker",
          walletBalance: data.walletBalance ?? 0,
          isPremium: data.isPremium || false,
          subscription: data.subscription || { status: data.isPremium ? "active" : "none" },
          subscriptionHistory: data.subscriptionHistory || []
        } as AdminUser);
      });
      setUsers(list);

      // Re-bind currently selected user if available
      if (selectedUser) {
        const updated = list.find((u) => u.id === selectedUser.id);
        if (updated) setSelectedUser(updated);
      }
    } catch (e) {
      console.error("Error fetching users:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApplySubscriptionChange = async (
    action: SubscriptionHistoryEntry["action"],
    updates: Partial<AdminSubscription>,
    isPremiumFlag: boolean,
    detailsMsg: string
  ) => {
    if (!selectedUser) return;
    setUpdating(true);

    try {
      const userRef = doc(db, "users", selectedUser.id);
      
      const newHistoryEntry: SubscriptionHistoryEntry = {
        action,
        date: new Date().toISOString(),
        details: detailsMsg,
        operator: currentUser?.email || "brokera284@gmail.com"
      };

      const existingHistory = selectedUser.subscriptionHistory || [];
      const updatedHistory = [...existingHistory, newHistoryEntry];

      const currentSub = selectedUser.subscription || { status: "none" };
      const mergedSub: AdminSubscription = {
        ...currentSub,
        ...updates
      };

      await updateDoc(userRef, {
        isPremium: isPremiumFlag,
        subscription: mergedSub,
        subscriptionHistory: updatedHistory
      });

      // Log event
      await writeAdminLog(
        currentUser?.uid || "admin",
        currentUser?.email || "brokera284@gmail.com",
        `subscription_${action}`,
        `Admin performed "${action}" on user ${selectedUser.email}. Details: ${detailsMsg}`,
        `users/${selectedUser.id}`
      );

      // Refresh data
      await fetchUsers();
      alert(`Subscription operation "${action}" applied successfully!`);
    } catch (e) {
      alert("Operation failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateManually = () => {
    const startsAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    handleApplySubscriptionChange(
      "create",
      { status: "active", startsAt, expiresAt, type: "premium_manual", activatedWithoutPayment: false },
      true,
      "Manually created standard Premium subscription (30 days)"
    );
  };

  const handleActivateFree = () => {
    const startsAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year
    handleApplySubscriptionChange(
      "activate",
      { status: "active", startsAt, expiresAt, type: "premium_free", activatedWithoutPayment: true },
      true,
      "Activated Premium License without payment (1 year complimentary)"
    );
  };

  const handleExtend = () => {
    if (!selectedUser?.subscription?.expiresAt) {
      alert("User does not have an active subscription expiry date to extend.");
      return;
    }
    const currentExpiry = new Date(selectedUser.subscription.expiresAt).getTime();
    const newExpiry = new Date(currentExpiry + extendDays * 24 * 60 * 60 * 1000).toISOString();
    handleApplySubscriptionChange(
      "extend",
      { expiresAt: newExpiry },
      true,
      `Extended subscription duration by ${extendDays} days.`
    );
  };

  const handlePause = () => {
    handleApplySubscriptionChange(
      "pause",
      { status: "paused" },
      false,
      "Paused subscription license"
    );
  };

  const handleResume = () => {
    handleApplySubscriptionChange(
      "resume",
      { status: "active" },
      true,
      "Resumed paused subscription license"
    );
  };

  const handleCancel = () => {
    handleApplySubscriptionChange(
      "cancel",
      { status: "cancelled" },
      false,
      "Cancelled active subscription billing"
    );
  };

  const handleChangeExpiry = () => {
    if (!customExpiryDate) {
      alert("Please select a valid custom expiration date first.");
      return;
    }
    const newExpiry = new Date(customExpiryDate).toISOString();
    handleApplySubscriptionChange(
      "change_expiry",
      { expiresAt: newExpiry },
      true,
      `Admin manually changed expiration threshold date to ${newExpiry.split("T")[0]}`
    );
  };

  const filteredUsers = users.filter((u) => {
    return (
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Award className="text-amber-500" size={22} />
          Premium License & Subscription Panel
        </h2>
        <p className="text-sm text-slate-400">
          Create manual overrides, activate complimentary accounts, freeze plans, or extend expiration thresholds dynamically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Pick User */}
        <div className="bg-slate-900/30 p-5 rounded-2xl border border-white/[0.05] space-y-4 lg:col-span-1">
          <h3 className="text-sm font-semibold text-white border-b border-white/[0.05] pb-2 uppercase tracking-wider text-amber-500">
            Step 1: Select User Account
          </h3>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search user email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
            {loading ? (
              <div className="text-center py-10 text-xs text-slate-500">Loading user list...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">No matching accounts</div>
            ) : (
              filteredUsers.map((u) => {
                const isUserSelected = selectedUser?.id === u.id;
                const status = u.subscription?.status || (u.isPremium ? "active" : "none");
                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className={`w-full text-left p-3 rounded-xl transition-all border ${
                      isUserSelected 
                        ? "bg-amber-500/10 border-amber-500/30" 
                        : "bg-slate-950/40 border-white/[0.03] hover:border-white/[0.1]"
                    }`}
                  >
                    <div className="font-bold text-xs text-white truncate">{u.email}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">{u.name}</div>
                    <div className="flex justify-between items-center mt-2 border-t border-white/[0.03] pt-1.5">
                      <span className="text-[9px] font-mono uppercase text-slate-500">Status:</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        status === "active" ? "bg-emerald-500/10 text-emerald-400" :
                        status === "paused" ? "bg-amber-500/10 text-amber-400" :
                        status === "cancelled" ? "bg-red-500/10 text-red-400" :
                        "bg-slate-500/10 text-slate-400"
                      }`}>
                        {status.toUpperCase()}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Step 2: Controls */}
        <div className="lg:col-span-2 space-y-6">
          {selectedUser ? (
            <div className="bg-slate-900/30 p-6 rounded-2xl border border-white/[0.05] space-y-6">
              {/* Header profile status */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/[0.05] pb-4 gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedUser.name} ({selectedUser.email})</h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">UID: {selectedUser.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Premium Status:</span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    selectedUser.isPremium ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"
                  }`}>
                    {selectedUser.isPremium ? "Premium Active" : "No Premium License"}
                  </span>
                </div>
              </div>

              {/* Action grid buttons */}
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider text-amber-500">
                  Administrative Subscriptions Override Actions
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Action 1: Create Manually */}
                  <div className="bg-slate-950/40 p-4 border border-white/[0.03] rounded-xl flex flex-col justify-between space-y-3">
                    <div>
                      <h6 className="text-xs font-bold text-white">Create Manual Subscription</h6>
                      <p className="text-[10px] text-slate-500 mt-0.5">Activate standard 30-day Premium membership variables.</p>
                    </div>
                    <button
                      onClick={handleCreateManually}
                      disabled={updating}
                      className="w-full py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.05] rounded-lg text-xs font-bold text-white transition-all cursor-pointer"
                    >
                      Initialize (30 Days)
                    </button>
                  </div>

                  {/* Action 2: Complimentary Activation */}
                  <div className="bg-slate-950/40 p-4 border border-white/[0.03] rounded-xl flex flex-col justify-between space-y-3">
                    <div>
                      <h6 className="text-xs font-bold text-white text-amber-400 flex items-center gap-1.5">
                        <Sparkles size={12} />
                        Activate Complimentarily (No Pay)
                      </h6>
                      <p className="text-[10px] text-slate-500 mt-0.5">Initialize a free complimentary license (expires in 1 year).</p>
                    </div>
                    <button
                      onClick={handleActivateFree}
                      disabled={updating}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all cursor-pointer"
                    >
                      Activate Free (365 Days)
                    </button>
                  </div>

                  {/* Action 3: Adjust Expiration Date */}
                  <div className="bg-slate-950/40 p-4 border border-white/[0.03] rounded-xl space-y-3 md:col-span-2">
                    <h6 className="text-xs font-bold text-white">Change Precise Expiration Date</h6>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={customExpiryDate}
                        onChange={(e) => setCustomExpiryDate(e.target.value)}
                        className="flex-1 bg-slate-950 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                      />
                      <button
                        onClick={handleChangeExpiry}
                        disabled={updating || !customExpiryDate}
                        className="px-4 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] rounded-lg text-xs font-bold text-white transition-all cursor-pointer"
                      >
                        Apply Date
                      </button>
                    </div>
                    {selectedUser.subscription?.expiresAt && (
                      <p className="text-[10px] text-slate-500">
                        Current Expiration: <span className="text-slate-300 font-bold">{new Date(selectedUser.subscription.expiresAt).toLocaleDateString()}</span>
                      </p>
                    )}
                  </div>

                  {/* Action 4: Extend Expiry */}
                  <div className="bg-slate-950/40 p-4 border border-white/[0.03] rounded-xl flex flex-col justify-between space-y-3">
                    <div>
                      <h6 className="text-xs font-bold text-white">Extend Expiration Days</h6>
                      <p className="text-[10px] text-slate-500 mt-0.5">Add extension intervals to current license expiry.</p>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={extendDays}
                        onChange={(e) => setExtendDays(parseInt(e.target.value))}
                        className="bg-slate-950 border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-white"
                      >
                        <option value={7}>7 Days</option>
                        <option value={30}>30 Days</option>
                        <option value={90}>90 Days</option>
                        <option value={365}>365 Days</option>
                      </select>
                      <button
                        onClick={handleExtend}
                        disabled={updating}
                        className="flex-1 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] rounded-lg text-xs font-bold text-white transition-all cursor-pointer"
                      >
                        Extend Expiration
                      </button>
                    </div>
                  </div>

                  {/* Action 5: Pause / Freeze / Cancel */}
                  <div className="bg-slate-950/40 p-4 border border-white/[0.03] rounded-xl flex flex-col justify-between space-y-3">
                    <div>
                      <h6 className="text-xs font-bold text-white">Pause, Resume or Cancel Plans</h6>
                      <p className="text-[10px] text-slate-500 mt-0.5">Toggle live license access permissions.</p>
                    </div>
                    <div className="flex gap-2">
                      {selectedUser.subscription?.status === "paused" ? (
                        <button
                          onClick={handleResume}
                          disabled={updating}
                          className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/20 cursor-pointer"
                        >
                          Resume
                        </button>
                      ) : (
                        <button
                          onClick={handlePause}
                          disabled={updating || !selectedUser.isPremium}
                          className="flex-1 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold border border-amber-500/20 cursor-pointer"
                        >
                          Pause
                        </button>
                      )}
                      <button
                        onClick={handleCancel}
                        disabled={updating || !selectedUser.isPremium}
                        className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold border border-red-500/20 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* History Timeline */}
              <div className="border-t border-white/[0.05] pt-4 space-y-3">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider text-amber-500">
                  User License Modification History
                </h5>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {selectedUser.subscriptionHistory && selectedUser.subscriptionHistory.length > 0 ? (
                    selectedUser.subscriptionHistory.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/40 border border-white/[0.03] rounded-xl flex justify-between gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span className="capitalize text-amber-400">{item.action}</span>
                            <span className="text-[10px] text-slate-500 font-mono">by {item.operator}</span>
                          </div>
                          <div className="text-slate-400 text-[11px]">{item.details}</div>
                        </div>
                        <div className="text-[10px] text-slate-500 text-right whitespace-nowrap">
                          {formatDate(item.date)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-500">No previous subscription adjustments logged.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/10 border border-white/[0.05] p-20 rounded-2xl text-center text-slate-500 text-sm">
              <Award size={48} className="text-slate-600 mx-auto mb-4" />
              Select a user account from the left pane to manage premium memberships and subscription logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
