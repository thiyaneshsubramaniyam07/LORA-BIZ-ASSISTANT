import React, { useState } from "react";
import { 
  Settings as SettingsIcon, User, Building, Moon, Sun, 
  Lock, Key, HelpCircle, LogOut, Check, Image, AlertCircle 
} from "lucide-react";

interface SettingsProps {
  user: any;
  onUpdateProfile: (profile: { name?: string; companyName?: string; avatarUrl?: string }) => Promise<void>;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Settings({ 
  user, onUpdateProfile, onLogout, darkMode, onToggleDarkMode 
}: SettingsProps) {
  const [name, setName] = useState(user.name);
  const [companyName, setCompanyName] = useState(user.companyName);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setSuccessMsg(false);
    
    try {
      await onUpdateProfile({ name, companyName, avatarUrl });
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Profile Form Panel - Left Columns */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
            <User className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">Business profile</h2>
            <p className="text-xs text-slate-400">Configure your professional identity and company branding</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 rounded-xl font-semibold flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              Your branding profile has been saved successfully!
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Your Full Name</label>
            <div className="relative">
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Company / Organization Name</label>
            <div className="relative">
              <input 
                type="text" 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Avatar Profile URL</label>
            <div className="relative">
              <input 
                type="text" 
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <Image className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md disabled:opacity-50"
          >
            {isUpdating ? "Saving..." : "Save Profile Details"}
          </button>
        </form>
      </div>

      {/* Utility Panel - Right Column */}
      <div className="space-y-6">
        {/* Theme Settings card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-50 dark:border-slate-800">
            <Sun className="w-4 h-4 text-blue-600" />
            Theme Preferences
          </h3>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Dark Canvas Mode</span>
            <button 
              onClick={onToggleDarkMode}
              className={`p-2 rounded-xl border flex items-center gap-2 transition ${
                darkMode 
                  ? "bg-slate-800 border-slate-700 text-amber-400" 
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              {darkMode ? (
                <>
                  <Sun className="w-4 h-4" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Key Settings Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-50 dark:border-slate-800">
            <Key className="w-4 h-4 text-blue-600" />
            Workspace Keys
          </h3>

          <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-800 dark:to-indigo-950/20 rounded-xl border border-blue-100 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-blue-800 dark:text-blue-400 flex items-center gap-1">
              <Key className="w-3.5 h-3.5" />
              Automated Secrets Sync
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              Google AI Studio automatically injects your <strong>GEMINI_API_KEY</strong> at runtime. You do not need to enter or manage keys manually.
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
              Environment Key Active
            </div>
          </div>
        </div>

        {/* Help/Logout block */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <button 
            onClick={onLogout}
            className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout Session
          </button>
        </div>
      </div>
    </div>
  );
}
