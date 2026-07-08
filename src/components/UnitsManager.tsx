import React, { useState } from "react";
import { Unit } from "../types";
import { Plus, Tag, ShieldCheck, Zap, Building, Percent, FileText, BarChart2, DollarSign, MapPin, X } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { motion } from "motion/react";

interface UnitsManagerProps {
  units: Unit[];
  onAddUnit: (unit: Omit<Unit, "id" | "createdAt">) => Promise<void>;
  formatCurrency: (amountInEGP: number) => string;
}

export default function UnitsManager({ units, onAddUnit, formatCurrency }: UnitsManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUnit, setNewUnit] = useState<Omit<Unit, "id" | "createdAt">>({
    title: "",
    description: "",
    price: 1500000,
    location: "",
    propertyType: "Smart Architecture",
    legalPaperStatus: "verified_boost",
    ownerName: "",
    ownerPhone: "",
    ownerPercentage: 90
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddUnit(newUnit);
    setShowAddModal(false);
    // Reset form
    setNewUnit({
      title: "",
      description: "",
      price: 1500000,
      location: "",
      propertyType: "Smart Architecture",
      legalPaperStatus: "verified_boost",
      ownerName: "",
      ownerPhone: "",
      ownerPercentage: 90
    });
  };

  // Pie Chart Data mapping the legal paper distribution
  const defaultChartData = [
    { name: "Legal Paper and Boost (60%)", value: 60, color: "#2563eb" },
    { name: "Legal Paper Only (30%)", value: 30, color: "#1d4ed8" },
    { name: "No Legal Paper (10%)", value: 10, color: "#475569" }
  ];

  // We can calculate actual listings distribution dynamically, or blend it with default priority constraints
  const actualBoosted = units.filter(u => u.legalPaperStatus === "verified_boost").length;
  const actualVerified = units.filter(u => u.legalPaperStatus === "verified").length;
  const actualNone = units.filter(u => u.legalPaperStatus === "none").length;
  const totalActual = actualBoosted + actualVerified + actualNone;

  const chartData = totalActual > 0 ? [
    { name: `Legal Paper & Boost (${Math.round((actualBoosted/totalActual)*100)}%)`, value: actualBoosted, color: "#2563eb" },
    { name: `Legal Paper Only (${Math.round((actualVerified/totalActual)*100)}%)`, value: actualVerified, color: "#1d4ed8" },
    { name: `No Legal Paper (${Math.round((actualNone/totalActual)*100)}%)`, value: actualNone, color: "#475569" }
  ] : defaultChartData;

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight font-display bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            High Quality Units Registry
          </h2>
          <p className="text-sm text-slate-400">Verify, catalog, and boost high-value real estate properties</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white font-bold px-5 py-3 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
        >
          <Plus size={16} />
          Register New Unit
        </button>
      </div>

      {/* TOP SUMMARY ROW / D3 CHART PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RECHARTS COMPONENT */}
        <div className="lg:col-span-1 bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-400 mb-1 flex items-center gap-2 font-mono">
              <BarChart2 size={14} />
              AI Recommendation Priorities
            </h3>
            <p className="text-[11px] text-slate-400 mb-4 leading-normal">
              AI model automatically prioritizes units with complete legal papers & premium boosting.
            </p>
          </div>

          <div className="h-44 w-full flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(6,9,25,0.95)", 
                    borderRadius: "12px", 
                    color: "#fff",
                    fontSize: "11px",
                    border: "1px solid rgba(255,255,255,0.1)"
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2">
            {chartData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* METRICS & CONSTRAINTS CARDS */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Owner Relations */}
          <div className="bg-gradient-to-br from-[#0c102a] to-[#040612] border border-white/5 text-white rounded-2xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl" />
            <div>
              <span className="bg-blue-500/20 text-blue-300 text-[10px] uppercase font-mono px-2.5 py-1 rounded">System Metric</span>
              <h3 className="text-2xl font-black mt-3">90% Direct Owner</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                Broker AI filters guarantee a maximum 10% third-party agency dilution. You work directly with primary title holders.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-400 font-bold mt-4 font-mono">
              <Percent size={14} />
              Owner Intermediary Caps Active
            </div>
          </div>

          {/* Boosting benefits card */}
          <div className="bg-black/40 border border-white/5 text-white rounded-2xl p-5 flex flex-col justify-between shadow-sm">
            <div>
              <span className="bg-blue-600/10 text-blue-400 border border-blue-500/15 text-[10px] uppercase font-bold px-2 py-1 rounded font-mono">Promotion Engine</span>
              <h3 className="text-base font-black mt-3 text-white">Legal Verification Boost</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Units registered with verified legal licensing and boosted status receive <strong>6x the view visibility</strong> in recommendations list streams.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-400 font-bold mt-4 font-mono">
              <Zap size={14} className="text-yellow-500 fill-yellow-500" />
              Automated AI distribution weights
            </div>
          </div>

        </div>
      </div>

      {/* UNITS CARDS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {units.length === 0 ? (
          <div className="col-span-full bg-black/30 border-2 border-dashed border-white/10 rounded-3xl p-12 text-center text-slate-300">
            <Building className="mx-auto text-slate-500 mb-3 animate-pulse" size={36} />
            <p className="text-sm font-bold text-white">No active units cataloged</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Be the first to list and boost a property unit!</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition shadow-sm"
            >
              Add Unit Now
            </button>
          </div>
        ) : (
          units.map((unit) => (
            <motion.div
              key={unit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-950/45 border border-white/[0.08] rounded-3xl overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.4)] flex flex-col justify-between hover:-translate-y-1 hover:border-[#5b8dff]/35 hover:shadow-[0_0_24px_rgba(90,140,255,0.12)] transition-all duration-300"
            >
              {/* Badge Headers */}
              <div className="p-4 flex justify-between items-start">
                <span className="text-[10px] font-mono tracking-wider bg-blue-600/15 text-blue-400 border border-blue-500/10 uppercase px-2 py-1 rounded font-bold">
                  {unit.propertyType}
                </span>

                {/* Legal Badge with precise colors */}
                {unit.legalPaperStatus === "verified_boost" && (
                  <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded flex items-center gap-1 shadow-sm">
                    <Zap size={10} className="fill-white" />
                    Verified & Boosted
                  </span>
                )}
                {unit.legalPaperStatus === "verified" && (
                  <span className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded flex items-center gap-1">
                    <ShieldCheck size={10} />
                    Verified Papers
                  </span>
                )}
                {unit.legalPaperStatus === "none" && (
                  <span className="bg-white/5 text-slate-400 text-[9px] uppercase font-bold px-2 py-1 rounded">
                    No Legal Papers
                  </span>
                )}
              </div>

              {/* Body */}
              <div className="px-4 pb-4 flex-1">
                <h3 className="text-base font-bold text-white leading-tight mb-1 truncate">{unit.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3 h-8">{unit.description}</p>
                
                {/* Info parameters */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-200 mb-4 border-t border-b border-white/5 py-2">
                  <div>
                    <span className="text-slate-500 uppercase text-[9px] block font-mono font-bold">Location</span>
                    <strong className="text-white">{unit.location}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[9px] block font-mono font-bold">Direct Contact</span>
                    <strong className="text-white">{unit.ownerName}</strong>
                  </div>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-[9px] uppercase font-mono tracking-wide text-slate-500 font-bold">Evaluation Price</span>
                  <span className="text-lg font-black text-white">
                    {formatCurrency(unit.price)}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-white/5 px-4 py-3 text-[10px] flex justify-between items-center border-t border-white/5">
                <span className="text-slate-400 font-medium">Owner Direct Intermediary</span>
                <span className="font-extrabold text-blue-400 text-xs">{unit.ownerPercentage}% Cap</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* NEW UNIT REGISTRY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#060919]/95 border border-white/10 rounded-[32px] p-7 max-w-md w-full shadow-[0_32px_96px_rgba(0,0,0,0.85)] text-white"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-black text-white font-display">Catalog Property Unit</h3>
                <p className="text-xs text-slate-400">List high-quality properties and configure AI weighting priority</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase tracking-wider">Property Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Glass Pavilion, Skyline Villa"
                  value={newUnit.title}
                  onChange={(e) => setNewUnit({ ...newUnit, title: e.target.value })}
                  className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase tracking-wider">Description</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Premium amenities, glass facade, smart sensors..."
                  value={newUnit.description}
                  onChange={(e) => setNewUnit({ ...newUnit, description: e.target.value })}
                  className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 placeholder-slate-600 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase tracking-wider">Price (EGP)</label>
                  <input
                    type="number"
                    required
                    value={newUnit.price}
                    onChange={(e) => setNewUnit({ ...newUnit, price: Number(e.target.value) })}
                    className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase tracking-wider">Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Downtown"
                    value={newUnit.location}
                    onChange={(e) => setNewUnit({ ...newUnit, location: e.target.value })}
                    className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 placeholder-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase tracking-wider">Type</label>
                  <select
                    value={newUnit.propertyType}
                    onChange={(e) => setNewUnit({ ...newUnit, propertyType: e.target.value })}
                    className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                  >
                    <option value="Smart Architecture">Smart Arch</option>
                    <option value="Glass Pavilion">Glass Pavilion</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase tracking-wider">Owner Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Owner Full Name"
                    value={newUnit.ownerName}
                    onChange={(e) => setNewUnit({ ...newUnit, ownerName: e.target.value })}
                    className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 placeholder-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase tracking-wider">Owner Phone</label>
                  <input
                    type="text"
                    placeholder="Owner Phone"
                    value={newUnit.ownerPhone}
                    onChange={(e) => setNewUnit({ ...newUnit, ownerPhone: e.target.value })}
                    className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 placeholder-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase tracking-wider">Owner Share Cap (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newUnit.ownerPercentage}
                    onChange={(e) => setNewUnit({ ...newUnit, ownerPercentage: Number(e.target.value) })}
                    className="w-full text-sm bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 font-mono uppercase tracking-wider">AI Recommendation Priority</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewUnit({ ...newUnit, legalPaperStatus: "verified_boost" })}
                    className={`py-2 px-1 text-[10px] font-bold border rounded-xl transition cursor-pointer ${
                      newUnit.legalPaperStatus === "verified_boost" 
                        ? "bg-blue-600 text-white border-transparent shadow-[0_0_10px_rgba(37,99,235,0.25)]" 
                        : "bg-black/40 text-slate-400 border-white/5 hover:bg-white/5"
                    }`}
                  >
                    Boost & Verify
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUnit({ ...newUnit, legalPaperStatus: "verified" })}
                    className={`py-2 px-1 text-[10px] font-bold border rounded-xl transition cursor-pointer ${
                      newUnit.legalPaperStatus === "verified" 
                        ? "bg-blue-800 text-white border-transparent" 
                        : "bg-black/40 text-slate-400 border-white/5 hover:bg-white/5"
                    }`}
                  >
                    Verify Papers
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUnit({ ...newUnit, legalPaperStatus: "none" })}
                    className={`py-2 px-1 text-[10px] font-bold border rounded-xl transition cursor-pointer ${
                      newUnit.legalPaperStatus === "none" 
                        ? "bg-slate-700 text-white border-transparent" 
                        : "bg-black/40 text-slate-400 border-white/5 hover:bg-white/5"
                    }`}
                  >
                    Standard
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-white/5 hover:bg-white/10 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-4.5 py-2.5 rounded-xl hover:scale-105 transition cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                >
                  Verify & Catalog
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
