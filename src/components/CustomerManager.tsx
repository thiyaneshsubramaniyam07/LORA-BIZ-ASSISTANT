import React, { useState } from "react";
import { 
  Users, Search, Plus, Trash2, Edit3, User, Building, Mail, 
  Phone, PlusCircle, Clock, AlertCircle, X, ChevronRight, MessageSquare
} from "lucide-react";
import { Customer, InteractionLog } from "../types";

interface CustomerManagerProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, "id" | "interactionHistory">) => Promise<void>;
  onEditCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  onDeleteCustomer: (id: string) => Promise<void>;
  onAddInteraction: (customerId: string, interaction: Omit<InteractionLog, "id" | "date">) => Promise<void>;
}

export default function CustomerManager({ 
  customers, onAddCustomer, onEditCustomer, onDeleteCustomer, onAddInteraction 
}: CustomerManagerProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(customers[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Customer | null>(null);

  // Add customer form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<'Lead' | 'Active' | 'Inactive'>("Lead");

  // Interaction Log form states
  const [logType, setLogType] = useState<'Email' | 'Call' | 'Meeting' | 'Note'>("Call");
  const [logSummary, setLogSummary] = useState("");
  const [logNotes, setLogNotes] = useState("");

  const activeCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    await onAddCustomer({ name, email, phone, company, status });
    setName("");
    setEmail("");
    setPhone("");
    setCompany("");
    setStatus("Lead");
    setShowAddModal(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;

    await onEditCustomer(showEditModal.id, { name, email, phone, company, status });
    setShowEditModal(null);
  };

  const handleAddInteractionLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer || !logSummary) return;

    await onAddInteraction(activeCustomer.id, {
      type: logType,
      summary: logSummary,
      notes: logNotes
    });

    setLogSummary("");
    setLogNotes("");
  };

  const handleOpenEditModal = (cust: Customer) => {
    setName(cust.name);
    setEmail(cust.email);
    setPhone(cust.phone);
    setCompany(cust.company);
    setStatus(cust.status);
    setShowEditModal(cust);
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.company.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Customer List Index - Left Column */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-140px)]">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-display font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              CRM Accounts
            </h3>
            <button 
              onClick={() => {
                setName("");
                setEmail("");
                setPhone("");
                setCompany("");
                setStatus("Lead");
                setShowAddModal(true);
              }}
              className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              title="Add Customer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <input 
              type="text" 
              placeholder="Search customers or company..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Customer Roster List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No clients matched search parameters.
            </div>
          ) : (
            filteredCustomers.map((c) => {
              const isSelected = selectedCustomerId === c.id || (!selectedCustomerId && activeCustomer?.id === c.id);
              return (
                <div 
                  key={c.id}
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={`p-4 flex items-center justify-between cursor-pointer transition ${
                    isSelected ? "bg-blue-50/40 dark:bg-blue-950/20 border-l-4 border-blue-600" : "hover:bg-slate-50 dark:hover:bg-slate-800/20"
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 block truncate">{c.name}</span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                      <Building className="w-3.5 h-3.5" />
                      {c.company}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      c.status === "Active" 
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" 
                        : c.status === "Lead" 
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400" 
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>
                      {c.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Profile Detail and Timeline Log panel - Right 2 Columns */}
      <div className="lg:col-span-2 space-y-6">
        {activeCustomer ? (
          <>
            {/* Customer Profile Info Card */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative group">
              {/* Edit/Delete control hover buttons */}
              <div className="absolute top-4 right-4 flex gap-1">
                <button 
                  onClick={() => handleOpenEditModal(activeCustomer)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
                  title="Edit Customer"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    onDeleteCustomer(activeCustomer.id);
                    setSelectedCustomerId(null);
                  }}
                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-rose-500 transition"
                  title="Delete Customer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-display font-semibold text-lg flex-shrink-0 shadow-md">
                  {activeCustomer.name[0]}
                </div>
                <div>
                  <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">{activeCustomer.name}</h2>
                  <span className="text-xs text-slate-400 font-semibold">{activeCustomer.company}</span>
                </div>
              </div>

              {/* Core Contact Details block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-50 dark:border-slate-800/80 text-xs">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px]">Email Address</span>
                    <a href={`mailto:${activeCustomer.email}`} className="text-slate-700 dark:text-slate-300 hover:underline">{activeCustomer.email}</a>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-slate-400 block font-semibold text-[10px]">Phone Number</span>
                    <span className="text-slate-700 dark:text-slate-300">{activeCustomer.phone || "No phone listed"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interaction Logger and History list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Add Interaction Log */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-display font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                    <PlusCircle className="w-4 h-4 text-blue-600" />
                    Log New Interaction
                  </h3>

                  <form onSubmit={handleAddInteractionLog} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Interaction Type</label>
                      <select 
                        value={logType}
                        onChange={(e: any) => setLogType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:outline-none"
                      >
                        <option value="Call">📞 Phone Call</option>
                        <option value="Email">📧 Email Message</option>
                        <option value="Meeting">📅 In-Person Meeting</option>
                        <option value="Note">📝 Custom Advisory Note</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Interaction Summary</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Alignment call regarding milestones"
                        value={logSummary}
                        onChange={(e) => setLogSummary(e.target.value)}
                        required
                        className="w-full px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Detailed Discussion / Notes</label>
                      <textarea 
                        placeholder="Brief notes from consultation discussion..."
                        value={logNotes}
                        onChange={(e) => setLogNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={!logSummary}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow disabled:opacity-50"
                    >
                      Append Log Record
                    </button>
                  </form>
                </div>
              </div>

              {/* Interaction Timeline Log */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col max-h-[380px] overflow-hidden">
                <h3 className="text-sm font-display font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4 flex-shrink-0">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Interaction Timeline
                </h3>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1 relative pl-2">
                  {/* Timeline vertical axis line */}
                  <div className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800"></div>

                  {activeCustomer.interactionHistory.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-xs">
                      No logged interactions with this client contact.
                    </div>
                  ) : (
                    activeCustomer.interactionHistory.map((log) => (
                      <div key={log.id} className="relative pl-6 flex flex-col">
                        {/* Bullet point node */}
                        <span className="absolute left-[3px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 bg-blue-500"></span>
                        
                        <div className="text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{log.summary}</span>
                            <span className="text-[9px] text-slate-400 font-mono">{log.date}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-bold uppercase text-slate-400">
                            {log.type === "Call" ? "📞 Call" : log.type === "Email" ? "📧 Email" : log.type === "Meeting" ? "📅 Meet" : "📝 Note"}
                          </div>

                          {log.notes && (
                            <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/20 p-2 rounded-lg">
                              {log.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-slate-900 py-32 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center text-slate-400 text-xs">
            No customers added yet. Click plus icon to add.
          </div>
        )}
      </div>

      {/* --- ADD CUSTOMER MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-100 dark:border-slate-800 shadow-2xl relative animate-scale-up">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Add Customer Record
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Customer Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Peter Parker"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Company / Organization</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Daily Bugle"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Roster Status</label>
                  <select 
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none"
                  >
                    <option value="Lead">Lead Contact</option>
                    <option value="Active">Active Account</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="e.g. peter@bugle.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. +1-555-0143"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md mt-2"
              >
                Create CRM Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT CUSTOMER MODAL --- */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-100 dark:border-slate-800 shadow-2xl relative">
            <button 
              onClick={() => setShowEditModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-4">
              Edit CRM Record
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Customer Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Company / Organization</label>
                  <input 
                    type="text" 
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Roster Status</label>
                  <select 
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none"
                  >
                    <option value="Lead">Lead Contact</option>
                    <option value="Active">Active Account</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md"
              >
                Save Client Profile
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
