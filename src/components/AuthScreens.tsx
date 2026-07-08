import React, { useState } from "react";
import { 
  Lock, Mail, User, Building, Sparkles, Check, 
  ArrowRight, Key, AlertCircle, RefreshCw 
} from "lucide-react";

interface AuthScreensProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, name: string, companyName: string) => Promise<void>;
  error: string | null;
  setError: (err: string | null) => void;
}

export default function AuthScreens({ onLogin, onRegister, error, setError }: AuthScreensProps) {
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || !companyName) return;
    setLoading(true);
    setError(null);
    try {
      await onRegister(email, password, name, companyName);
    } catch (err: any) {
      setError(err.message || "Failed to register.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setForgotSubmitted(true);
    setError(null);
    setTimeout(() => {
      setForgotSubmitted(false);
      setView('login');
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-md bg-[#121212] rounded-3xl border border-[#262626] shadow-xl overflow-hidden p-8 space-y-6 relative">
        
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-violet-950/40 text-violet-400 rounded-2xl border border-violet-900/30">
            <Sparkles className="w-6 h-6 animate-pulse text-violet-400" />
          </div>
          <h2 className="text-xl font-display font-bold text-white tracking-tight">
            {view === 'login' && "AI Business Assistant"}
            {view === 'register' && "Create Partner Account"}
            {view === 'forgot' && "Recover Partner Account"}
          </h2>
          <p className="text-xs text-neutral-400">
            {view === 'login' && "Automate customer support, emails & SWOT insights"}
            {view === 'register' && "Begin scaling your small business consultancies"}
            {view === 'forgot' && "Recover password access keys for your account"}
          </p>
        </div>

        {/* System Credentials Alert notice */}
        {view === 'login' && (
          <div className="p-3 bg-[#1c1c1c] rounded-xl border border-[#262626] flex items-start gap-2.5">
            <AlertCircle className="w-4.5 h-4.5 text-violet-400 mt-0.5 flex-shrink-0" />
            <div className="text-[10.5px] leading-relaxed text-neutral-400 font-sans">
              <strong>Demo Credentials:</strong> Log in with email <span className="font-semibold text-violet-400">demo@example.com</span> and password <span className="font-semibold text-violet-400">password123</span> or register a new one.
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="p-3 bg-rose-950/40 text-rose-400 border border-rose-900/40 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Login Screen View */}
        {view === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-xs font-semibold text-neutral-500 block mb-1">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-9 pr-4 py-2 bg-[#0F0F0F] border border-[#262626] text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-neutral-500">Password</label>
                <button 
                  type="button" 
                  onClick={() => setView('forgot')}
                  className="text-[11px] text-violet-400 hover:text-violet-300 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-4 py-2 bg-[#0F0F0F] border border-[#262626] text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? "Authenticating..." : "Login to Workspace"}
              {!loading && <ArrowRight className="w-4 h-4 text-white" />}
            </button>

            <div className="text-center text-xs text-neutral-500 pt-2 font-sans">
              Don't have an account?{" "}
              <button 
                type="button" 
                onClick={() => setView('register')}
                className="text-violet-400 hover:text-violet-300 font-bold hover:underline cursor-pointer"
              >
                Register here
              </button>
            </div>
          </form>
        )}

        {/* Register Screen View */}
        {view === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-xs font-semibold text-neutral-500 block mb-1">Partner Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Mercer"
                  required
                  className="w-full pl-9 pr-4 py-2 bg-[#0F0F0F] border border-[#262626] text-white rounded-xl text-sm focus:outline-none"
                />
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-500 block mb-1">Company / Advisory Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Mercer Advisory Group"
                  required
                  className="w-full pl-9 pr-4 py-2 bg-[#0F0F0F] border border-[#262626] text-white rounded-xl text-sm focus:outline-none"
                />
                <Building className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-500 block mb-1">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-9 pr-4 py-2 bg-[#0F0F0F] border border-[#262626] text-white rounded-xl text-sm focus:outline-none"
                />
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-500 block mb-1">Secure Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-4 py-2 bg-[#0F0F0F] border border-[#262626] text-white rounded-xl text-sm focus:outline-none"
                />
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? "Registering..." : "Create Account & Login"}
            </button>

            <div className="text-center text-xs text-neutral-500 pt-2 font-sans">
              Already have an account?{" "}
              <button 
                type="button" 
                onClick={() => setView('login')}
                className="text-violet-400 hover:text-violet-300 font-bold hover:underline cursor-pointer"
              >
                Login here
              </button>
            </div>
          </form>
        )}

        {/* Forgot Password Recovery Screen */}
        {view === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4 text-xs">
            {forgotSubmitted ? (
              <div className="p-4 bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 rounded-xl font-semibold space-y-2 text-center">
                <Check className="w-8 h-8 mx-auto text-emerald-500 animate-bounce" />
                <h4 className="text-sm font-bold">Recovery Link Dispatched</h4>
                <p className="text-[11px] leading-relaxed font-sans text-neutral-400">
                  We've dispatched simulated recovery parameters to your inbox. Returning you to the login screen...
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 block mb-1">Email Address</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full pl-9 pr-4 py-2 bg-[#0F0F0F] border border-[#262626] text-white rounded-xl text-sm focus:outline-none"
                    />
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Send Password Reset
                </button>

                <div className="text-center text-xs text-neutral-500 pt-2 font-sans">
                  Remember your password?{" "}
                  <button 
                    type="button" 
                    onClick={() => setView('login')}
                    className="text-violet-400 hover:text-violet-300 font-bold hover:underline cursor-pointer"
                  >
                    Go to Login
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
