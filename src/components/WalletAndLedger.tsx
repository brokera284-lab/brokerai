import React, { useState } from "react";
import { Transaction } from "../types";
import { 
  CreditCard, Smartphone, Banknote, ListCollapse, ArrowUpRight, ArrowDownLeft, RefreshCw, Landmark, CheckCircle2
} from "lucide-react";
import { motion } from "motion/react";

interface WalletAndLedgerProps {
  walletBalance: number;
  transactions: Transaction[];
  onRecharge: (amount: number, method: Transaction["method"]) => Promise<void>;
  formatCurrency: (amountInEGP: number) => string;
}

export default function WalletAndLedger({ walletBalance, transactions, onRecharge, formatCurrency }: WalletAndLedgerProps) {
  const [rechargeAmount, setRechargeAmount] = useState<number>(1000);
  const [selectedMethod, setSelectedMethod] = useState<Transaction["method"]>("visa");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rechargeAmount <= 0) return;
    setLoading(true);
    setSuccessMsg(null);
    try {
      await onRecharge(rechargeAmount, selectedMethod);
      setSuccessMsg(`Successfully credited ${formatCurrency(rechargeAmount)} into your broker wallet via ${selectedMethod.toUpperCase()}!`);
      // auto clear after 5s
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err) {
      console.error(err);
      setSuccessMsg("Error authorizing transaction stream.");
    } finally {
      setLoading(false);
    }
  };

  // Payment methods with descriptive icons
  const methods: { id: Transaction["method"]; name: string; color: string }[] = [
    { id: "visa", name: "Visa / Credit Card", color: "from-blue-600 to-indigo-700" },
    { id: "vodafone", name: "Vodafone Cash", color: "from-red-600 to-red-700" },
    { id: "etisalat", name: "Etisalat Cash", color: "from-green-600 to-green-700" },
    { id: "orange", name: "Orange Cash", color: "from-orange-500 to-orange-600" },
    { id: "wepay", name: "WePay (Telecom)", color: "from-purple-600 to-purple-700" },
    { id: "instapay", name: "Instapay (Direct)", color: "from-teal-500 to-teal-600" }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-primary-dark">
      
      {/* WALLET METRIC & RECHARGE CARD */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Wallet Balance Visual Display */}
        <div className="bg-gradient-to-br from-primary-dark to-primary-deep border border-primary-mid/10 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-44 h-44 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <p className="text-xs uppercase font-extrabold tracking-widest text-primary-light mb-2">Available Balance</p>
          <h3 className="text-3xl font-black">{formatCurrency(walletBalance)}</h3>
          <p className="text-[11px] text-blue-100/90 mt-4 leading-relaxed">
            Use your wallet balance to purchase premium AI qualified leads and manage subscriptions. All service lines operate on an immediate pay-as-you-go stream.
          </p>
        </div>

        {/* Quick Top-up Dock */}
        <div className="bg-white/60 border border-primary-mid/15 rounded-3xl p-6 shadow-sm space-y-4 text-primary-dark">
          <h4 className="text-sm font-bold text-primary-deep border-b border-primary-mid/10 pb-2">
            Recharge Wallet Balance
          </h4>

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex gap-2 items-start animate-fade-in">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleRecharge} className="space-y-4">
            
            {/* Quick selectors */}
            <div>
              <label className="block text-xs font-bold text-primary-deep mb-1.5">Select Amount (EGP)</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRechargeAmount(amt)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      rechargeAmount === amt 
                        ? "bg-primary-deep text-white border-primary-deep" 
                        : "bg-primary-deep/5 text-primary-deep border-primary-mid/15 hover:bg-primary-deep/10"
                    }`}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual field */}
            <div>
              <input
                type="number"
                min="10"
                required
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(Number(e.target.value))}
                className="w-full text-sm bg-white border border-primary-mid/15 rounded-xl px-3 py-2 outline-none focus:border-primary-mid text-primary-deep font-bold placeholder-primary-mid/30"
                placeholder="Custom Amount (EGP)"
              />
            </div>

            {/* Custom Payment Methods Grid */}
            <div>
              <label className="block text-xs font-bold text-primary-deep mb-1.5">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethod(m.id)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition cursor-pointer ${
                      selectedMethod === m.id 
                        ? "border-primary-mid bg-primary-deep/5 ring-1 ring-primary-mid" 
                        : "border-primary-mid/15 bg-white hover:border-primary-mid/30"
                    }`}
                  >
                    <div className="w-6 h-6 rounded-lg bg-primary-deep/5 text-primary-deep flex items-center justify-center shrink-0">
                      {m.id === "visa" && <CreditCard size={14} />}
                      {["vodafone", "etisalat", "orange", "wepay"].includes(m.id) && <Smartphone size={14} />}
                      {m.id === "instapay" && <Landmark size={14} />}
                    </div>
                    <span className="text-[10px] font-bold text-primary-deep truncate">{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-deep hover:bg-primary-mid text-white text-xs font-extrabold py-2.5 rounded-xl hover:scale-[1.01] transition shadow-md cursor-pointer"
            >
              {loading ? "Authorizing Payment..." : `Authorize Pay-as-you-go Stream`}
            </button>

          </form>
        </div>

      </div>

      {/* TRANSACTION LEDGER HISTORIC LIST */}
      <div className="lg:col-span-2 bg-white/60 border border-primary-mid/15 rounded-3xl p-6 shadow-sm flex flex-col justify-between text-primary-dark">
        <div>
          <h4 className="text-sm font-bold text-primary-deep border-b border-primary-mid/10 pb-2 flex items-center gap-2 font-display">
            <ListCollapse size={16} className="text-primary-deep" />
            Wallet Transaction Ledger
          </h4>

          <div className="overflow-y-auto max-h-[50vh] pr-1 space-y-3 mt-4">
            {transactions.length === 0 ? (
              <div className="text-center py-16 text-primary-mid/50 text-xs leading-relaxed">
                No historic payment records found in database ledger.
              </div>
            ) : (
              transactions.map((tx) => {
                const isCredit = tx.type === "credit" || tx.type === "refund";
                return (
                  <div
                    key={tx.id}
                    className="bg-white/40 border border-primary-mid/10 rounded-xl p-3 flex justify-between items-center text-xs shadow-sm text-primary-dark"
                  >
                    <div className="flex gap-3 items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                        isCredit ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}>
                        {isCredit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div>
                        <p className="font-bold text-primary-deep">{tx.description}</p>
                        <p className="text-[10px] text-primary-mid/50 flex items-center gap-1.5 uppercase font-mono mt-0.5">
                          <span>Via {tx.method}</span>
                          <span>•</span>
                          <span>{tx.type}</span>
                        </p>
                      </div>
                    </div>

                    <span className={`font-mono font-black text-sm ${isCredit ? "text-emerald-700" : "text-rose-700"}`}>
                      {isCredit ? "+" : "-"}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="text-[10px] text-primary-mid/50 border-t border-primary-mid/10 pt-4 text-center mt-4">
          Payment ledger encrypted with secure FireStore security hashes.
        </div>
      </div>

    </div>
  );
}
