import React from "react";
import { Transaction } from "../types";
import { 
  CreditCard, Smartphone, ListCollapse, ArrowUpRight, ArrowDownLeft, Landmark
} from "lucide-react";

interface DirectPaymentLedgerProps {
  transactions: Transaction[];
  formatCurrency: (amountInEGP: number) => string;
}

export default function WalletAndLedger({ transactions, formatCurrency }: DirectPaymentLedgerProps) {
  return (
    <div className="bg-white/60 border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 text-slate-800">
      <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
        <ListCollapse size={16} className="text-slate-700" />
        Direct Payments & Receipts History
      </h4>

      {transactions.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs">
          No direct payments recorded yet.
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <div key={tx.id} className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${tx.type === "credit" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                  {tx.type === "credit" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{tx.description}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-mono">{tx.method} • Direct Instant Pay</p>
                </div>
              </div>
              <span className={`font-mono font-bold ${tx.type === "credit" ? "text-emerald-600" : "text-slate-900"}`}>
                {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
