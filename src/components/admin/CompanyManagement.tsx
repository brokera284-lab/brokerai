import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { AdminCompany } from "./AdminTypes";
import { writeAdminLog } from "./adminLogger";
import { Building2, Search, Edit2, ShieldAlert, CheckCircle2, XCircle, Ban, RefreshCw, Save, ArrowRight, Eye } from "lucide-react";
import { motion } from "motion/react";

interface CompanyManagementProps {
  currentUser: any;
  formatDate: (val: any) => string;
}

export default function CompanyManagement({ currentUser, formatDate }: CompanyManagementProps) {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected" | "suspended">("all");
  
  // Edit State
  const [editingCompany, setEditingCompany] = useState<AdminCompany | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      // Fetch companies
      const snap = await getDocs(collection(db, "companies"));
      const list: AdminCompany[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, status: "approved", isVerified: false, ...d.data() } as AdminCompany);
      });
      setCompanies(list);
    } catch (e) {
      console.error("Error fetching companies:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleUpdateStatus = async (companyId: string, newStatus: AdminCompany["status"]) => {
    const confirmation = window.confirm(`Are you sure you want to change this company's status to "${newStatus}"?`);
    if (!confirmation) return;

    try {
      const docRef = doc(db, "companies", companyId);
      const isVerified = newStatus === "approved";
      await updateDoc(docRef, { status: newStatus, isVerified });

      // Update state
      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, status: newStatus, isVerified } : c))
      );

      // Log action
      await writeAdminLog(
        currentUser?.uid || "admin",
        currentUser?.email || "brokera284@gmail.com",
        `company_${newStatus}`,
        `Updated company status for ${companyId} to "${newStatus}".`,
        `companies/${companyId}`
      );
    } catch (e) {
      alert("Failed to update status: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;
    setSaving(true);
    try {
      const docRef = doc(db, "companies", editingCompany.id);
      await updateDoc(docRef, {
        name: editingCompany.name,
        commercialRegistration: editingCompany.commercialRegistration,
        website: editingCompany.website || "",
        address: editingCompany.address || ""
      });

      // Update state
      setCompanies((prev) =>
        prev.map((c) => (c.id === editingCompany.id ? editingCompany : c))
      );

      // Log action
      await writeAdminLog(
        currentUser?.uid || "admin",
        currentUser?.email || "brokera284@gmail.com",
        "company_edited",
        `Edited registration details for company "${editingCompany.name}" (${editingCompany.id}).`,
        `companies/${editingCompany.id}`
      );

      setEditingCompany(null);
    } catch (e) {
      alert("Failed to save changes: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.commercialRegistration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.address || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || c.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="text-amber-500" size={22} />
            Company & Real Estate Brokerages Registry
          </h2>
          <p className="text-sm text-slate-400">
            Verify legal commercial registry logs, manage approval pipelines, and update corporate directories.
          </p>
        </div>
        <button
          onClick={fetchCompanies}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs font-semibold text-white hover:bg-white/[0.1] active:scale-95 transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Sync Directory
        </button>
      </div>

      {/* Grid search filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/40 p-4 rounded-2xl border border-white/[0.05]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search by company name, CR number, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
          >
            <option value="all">All Verification Statuses</option>
            <option value="pending">Pending Verification</option>
            <option value="approved">Approved & Verified</option>
            <option value="rejected">Rejected Registration</option>
            <option value="suspended">Suspended Operations</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-xs text-slate-400 font-mono">
          Showing {filteredCompanies.length} of {companies.length} corporate registries
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/20 border border-white/[0.05] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400">
            <RefreshCw size={24} className="animate-spin mx-auto mb-4 text-amber-500" />
            Loading corporate directories...
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">
            <Building2 size={40} className="mx-auto mb-4 text-slate-600" />
            <p className="font-bold text-white mb-1">No Registered Companies Found</p>
            <p className="text-xs text-slate-500">There are no brokerage agency documents in the database.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.02] text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Corporate Info</th>
                  <th className="py-3 px-4">CR / Registry ID</th>
                  <th className="py-3 px-4">Legal Representative</th>
                  <th className="py-3 px-4">Verification Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filteredCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.01] transition-colors text-slate-300">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        {c.name}
                        {c.isVerified && <CheckCircle2 size={14} className="text-emerald-400" />}
                      </div>
                      <div className="text-xs text-slate-500">{c.address || "No Address Added"}</div>
                      {c.website && (
                        <a href={c.website} target="_blank" rel="noreferrer" className="text-[10px] text-amber-400/80 hover:underline">
                          {c.website}
                        </a>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-300">
                      {c.commercialRegistration}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="text-slate-300">{c.ownerEmail || "Associated UID"}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{c.ownerUid}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        c.status === "approved" ? "bg-emerald-500/15 text-emerald-400" :
                        c.status === "pending" ? "bg-amber-500/15 text-amber-400" :
                        c.status === "suspended" ? "bg-red-500/15 text-red-400" :
                        "bg-slate-500/15 text-slate-400"
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {c.status ? c.status.toUpperCase() : "PENDING"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => setEditingCompany(c)}
                        className="px-2.5 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.05] rounded-lg text-xs font-semibold text-white transition-all cursor-pointer"
                        title="Edit details"
                      >
                        <Edit2 size={12} />
                      </button>

                      {c.status !== "approved" && (
                        <button
                          onClick={() => handleUpdateStatus(c.id, "approved")}
                          className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-xs font-semibold text-emerald-400 transition-all cursor-pointer"
                        >
                          Approve
                        </button>
                      )}

                      {c.status === "approved" && (
                        <button
                          onClick={() => handleUpdateStatus(c.id, "suspended")}
                          className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-semibold text-red-400 transition-all cursor-pointer"
                          title="Suspend corporate credentials"
                        >
                          <Ban size={12} />
                        </button>
                      )}

                      {c.status === "pending" && (
                        <button
                          onClick={() => handleUpdateStatus(c.id, "rejected")}
                          className="px-2.5 py-1.5 bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/20 rounded-lg text-xs font-semibold text-slate-400 transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Editing Modal overlay */}
      {editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-slate-900 border border-white/[0.1] rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-white/[0.05] pb-3">
              <h3 className="font-bold text-white text-lg">Edit Registration: {editingCompany.name}</h3>
              <button onClick={() => setEditingCompany(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Company Registered Name</label>
                <input
                  type="text"
                  value={editingCompany.name}
                  onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                  className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Commercial Registration Number (CR)</label>
                <input
                  type="text"
                  value={editingCompany.commercialRegistration}
                  onChange={(e) => setEditingCompany({ ...editingCompany, commercialRegistration: e.target.value })}
                  className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Official Website URL</label>
                <input
                  type="url"
                  value={editingCompany.website || ""}
                  onChange={(e) => setEditingCompany({ ...editingCompany, website: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Headquarters Office Address</label>
                <input
                  type="text"
                  value={editingCompany.address || ""}
                  onChange={(e) => setEditingCompany({ ...editingCompany, address: e.target.value })}
                  className="w-full bg-slate-950 border border-white/[0.08] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.05]">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="px-4 py-2 bg-slate-800 text-xs font-semibold text-slate-300 rounded-xl hover:bg-slate-700 cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs uppercase rounded-xl hover:bg-amber-400 cursor-pointer"
                >
                  <Save size={14} />
                  {saving ? "Saving..." : "Commit Update"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
