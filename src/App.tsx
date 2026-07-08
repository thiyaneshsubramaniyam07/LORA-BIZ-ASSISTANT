import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, LayoutDashboard, MessageSquare, Users, 
  Calendar, Mail, FileText, Settings as SettingsIcon, LogOut, 
  Menu, X, Moon, Sun, Clock, User, Building, AlertCircle 
} from "lucide-react";

// Components
import Dashboard from "./components/Dashboard";
import ChatAssistant from "./components/ChatAssistant";
import CustomerManager from "./components/CustomerManager";
import CalendarScheduler from "./components/CalendarScheduler";
import EmailAssistant from "./components/EmailAssistant";
import BusinessReports from "./components/BusinessReports";
import Settings from "./components/Settings";
import AuthScreens from "./components/AuthScreens";

// Types
import { Customer, Task, Meeting, SalesRecord, User as UserType, InteractionLog, ChatMessage } from "./types";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Database states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [sales, setSales] = useState<SalesRecord[]>([]);
  
  // App-wide loaders & feedback
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Chat Assistant states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "msg-initial",
      role: "model",
      text: "### Welcome to your Corporate AI Copilot! 👋\n\nI am connected to your enterprise registers. Ask me anything about your current active accounts, monthly sales matrices, or draft custom consulting pitch frameworks.\n\nType **'hello'** to explore my quick capabilities!",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);

  const handleSendMessage = async (text: string, model?: string, role?: string, useSearch?: boolean) => {
    const token = localStorage.getItem("auth-token");
    if (!token) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setIsSendingChat(true);

    try {
      const historyPayload = chatMessages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token
        },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          model: model || "gemini-3.5-flash",
          role: role || "advisor",
          useSearch: !!useSearch
        })
      });

      if (response.ok) {
        const data = await response.json();
        const modelMsg: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          role: "model",
          text: data.text,
          sources: data.groundingSources || [],
          timestamp: new Date().toLocaleTimeString()
        };
        setChatMessages(prev => [...prev, modelMsg]);
      } else {
        if (response.status === 401) {
          handleLogout();
          throw new Error("Your session has expired. Please log in again.");
        }
        let errorMsg = "Chat response was not okay";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errorMsg = errData.error;
          }
        } catch (e) {}
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error(err);
      const modelErrorMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: "model",
        text: `### ⚠️ Operational Sync Disrupted\n\nI encountered an error dispatching that query: **${err.message || "Unknown Error"}**.\n\nPlease check your server logs, ensure your Gemini API key is configured correctly under the Secrets panel, or try again in a few moments.`,
        timestamp: new Date().toLocaleTimeString()
      };
      setChatMessages(prev => [...prev, modelErrorMsg]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleClearChatHistory = () => {
    setChatMessages([
      {
        id: "msg-initial",
        role: "model",
        text: "### Chat Log Cleared 📋\n\nI am ready for a new prompt thread. Let me know what corporate structures we should explore next!",
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  // Sync / Fetch from database
  const fetchAllData = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/data", {
        headers: {
          "Authorization": token
        }
      });
      if (response.ok) {
        const payload = await response.json();
        setCustomers(payload.customers || []);
        setTasks(payload.tasks || []);
        setMeetings(payload.meetings || []);
        setSales(payload.sales || []);
      } else if (response.status === 401) {
        handleLogout();
      }
    } catch (err) {
      console.error("Database connection failure:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Check auth status on mount
  useEffect(() => {
    const cachedToken = localStorage.getItem("auth-token");
    const cachedUser = localStorage.getItem("auth-user");
    const cachedTheme = localStorage.getItem("theme");

    // Initialize Theme
    setDarkMode(true);
    document.documentElement.classList.add("dark");

    if (cachedToken && cachedUser) {
      try {
        const parsedUser = JSON.parse(cachedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        fetchAllData(cachedToken);
      } catch (e) {
        // Clear corrupt state
        localStorage.removeItem("auth-token");
        localStorage.removeItem("auth-user");
      }
    }
  }, []);

  const handleToggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Auth Operations
  const handleLogin = async (email: string, pass: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Invalid credentials");

      localStorage.setItem("auth-token", data.token);
      localStorage.setItem("auth-user", JSON.stringify(data.user));
      setUser(data.user);
      setIsAuthenticated(true);
      fetchAllData(data.token);
    } catch (err: any) {
      throw err;
    }
  };

  const handleRegister = async (email: string, pass: string, name: string, comp: string) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass, name, companyName: comp })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to register");

      localStorage.setItem("auth-token", data.token);
      localStorage.setItem("auth-user", JSON.stringify(data.user));
      setUser(data.user);
      setIsAuthenticated(true);
      fetchAllData(data.token);
    } catch (err: any) {
      throw err;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth-token");
    localStorage.removeItem("auth-user");
    setUser(null);
    setIsAuthenticated(false);
    setCustomers([]);
    setTasks([]);
    setMeetings([]);
    setSales([]);
  };

  const handleUpdateProfile = async (profile: { name?: string; companyName?: string; avatarUrl?: string }) => {
    const token = localStorage.getItem("auth-token");
    if (!token) return;

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token
        },
        body: JSON.stringify(profile)
      });
      if (response.ok) {
        const updated = await response.json();
        setUser(updated.user);
        localStorage.setItem("auth-user", JSON.stringify(updated.user));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // CRM CRUD Operations
  const handleAddCustomer = async (cust: Omit<Customer, "id" | "interactionHistory">) => {
    const token = localStorage.getItem("auth-token");
    if (!token) return;
    try {
      const response = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify(cust)
      });
      if (response.ok) {
        fetchAllData(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCustomer = async (id: string, cust: Partial<Customer>) => {
    const token = localStorage.getItem("auth-token");
    if (!token) return;
    try {
      const response = await fetch(`/api/crm?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify(cust)
      });
      if (response.ok) {
        fetchAllData(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    const token = localStorage.getItem("auth-token");
    if (!token) return;
    try {
      const response = await fetch(`/api/crm?id=${id}`, {
        method: "DELETE",
        headers: { "Authorization": token }
      });
      if (response.ok) {
        fetchAllData(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddInteraction = async (customerId: string, log: Omit<InteractionLog, "id" | "date">) => {
    const token = localStorage.getItem("auth-token");
    if (!token) return;
    try {
      const response = await fetch("/api/crm/interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify({ customerId, ...log })
      });
      if (response.ok) {
        fetchAllData(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Tasks operations
  const handleAddTask = async (task: Omit<Task, "id" | "status">) => {
    const token = localStorage.getItem("auth-token");
    if (!token) return;
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify(task)
      });
      if (response.ok) {
        fetchAllData(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTask = async (id: string, status: "Pending" | "Completed") => {
    const token = localStorage.getItem("auth-token");
    if (!token) return;
    try {
      const response = await fetch(`/api/tasks?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        fetchAllData(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    const token = localStorage.getItem("auth-token");
    if (!token) return;
    try {
      const response = await fetch(`/api/tasks?id=${id}`, {
        method: "DELETE",
        headers: { "Authorization": token }
      });
      if (response.ok) {
        fetchAllData(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Meetings operations
  const handleAddMeeting = async (meet: Omit<Meeting, "id">) => {
    const token = localStorage.getItem("auth-token");
    if (!token) return;
    try {
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify(meet)
      });
      if (response.ok) {
        fetchAllData(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditMeeting = async (id: string, meet: Partial<Meeting>) => {
    const token = localStorage.getItem("auth-token");
    if (!token) return;
    try {
      const response = await fetch(`/api/meetings?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify(meet)
      });
      if (response.ok) {
        fetchAllData(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    const token = localStorage.getItem("auth-token");
    if (!token) return;
    try {
      const response = await fetch(`/api/meetings?id=${id}`, {
        method: "DELETE",
        headers: { "Authorization": token }
      });
      if (response.ok) {
        fetchAllData(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Unauthenticated screen
  if (!isAuthenticated || !user) {
    return (
      <AuthScreens 
        onLogin={handleLogin} 
        onRegister={handleRegister} 
        error={authError} 
        setError={setAuthError} 
      />
    );
  }

  // Navigation Items
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "chat", label: "AI Copilot", icon: MessageSquare },
    { id: "crm", label: "CRM Accounts", icon: Users },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "email", label: "Email Copilot", icon: Mail },
    { id: "reports", label: "SWOT Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: SettingsIcon }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex font-sans text-[#E5E5E5] transition-colors duration-200">
      
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            key="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black z-30 no-print md:hidden cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR NAVIGATION - Left panel */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            key="sidebar-panel"
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="no-print fixed inset-y-0 left-0 z-40 w-60 bg-[#0F0F0F] border-r border-[#262626] p-5 flex flex-col justify-between md:static"
          >
            <div className="space-y-6">
              {/* Brand Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-violet-600 text-white rounded-xl shadow-md flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </span>
                  <div>
                    <h1 className="text-sm font-display font-bold text-white leading-none">AI Partner</h1>
                    <span className="text-[10px] text-[#737373] font-bold uppercase tracking-wider">Business Suite</span>
                  </div>
                </div>
                {/* Close Sidebar mobile only button */}
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 hover:bg-[#171717] rounded-lg text-neutral-400 md:hidden cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Brief profile card */}
              <div className="p-3.5 bg-[#171717] rounded-2xl border border-[#262626] flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white flex items-center justify-center font-display font-semibold text-sm flex-shrink-0">
                  {user.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-white block truncate">{user.name}</span>
                  <span className="text-[10px] text-[#737373] block truncate font-semibold">{user.companyName}</span>
                </div>
              </div>

              {/* Nav Items Link List */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const IconComp = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id);
                        // close drawer on mobile view selects
                        if (isMobile) setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4.5 py-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        isActive 
                          ? "bg-violet-600 text-white shadow-md shadow-violet-500/10" 
                          : "text-neutral-400 hover:text-white hover:bg-[#171717]"
                      }`}
                    >
                      <IconComp className={`w-4.5 h-4.5 ${isActive ? "text-white" : "text-neutral-400"}`} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Footer controls inside sidebar */}
            <div className="space-y-4 pt-4 border-t border-[#262626]">
              <div className="flex items-center justify-between text-xs px-2">
                <span className="text-[#737373] font-medium font-sans">System Theme</span>
                <button 
                  disabled
                  className="p-1.5 rounded-lg text-violet-400 flex items-center gap-1 font-mono text-[10px]"
                >
                  <Sun className="w-4 h-4 animate-spin-slow text-violet-400" />
                  ELEGANT DARK
                </button>
              </div>

              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4.5 py-2.5 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 rounded-xl text-xs font-bold transition border border-rose-900/30 cursor-pointer"
              >
                <LogOut className="w-4.5 h-4.5" />
                Logout Account
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* VIEWPORT PANEL CONTENT - Right of Sidebar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Dynamic Header navbar */}
        <header className="no-print bg-[#0A0A0A] border-b border-[#262626] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Burger toggle */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-[#171717] rounded-lg text-neutral-400 cursor-pointer"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>

            <div>
              <h2 className="text-md font-display font-bold text-white capitalize">
                {currentView === 'dashboard' ? 'Business Operations' : currentView === 'chat' ? 'Advisory Copilot' : currentView}
              </h2>
              <p className="text-[11px] text-[#737373] font-mono hidden sm:block">
                SYSTEM TIME: 2026-07-08 10:15 UTC • ACTIVE CACHE SECURE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#171717] border border-[#262626] rounded-lg text-[10px] text-green-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              AI Online
            </div>
          </div>
        </header>

        {/* Dynamic Inner View Switch board container */}
        <main className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto">
          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-[#737373] mt-4 font-mono font-bold">Synchronizing advisory databases & security caches...</p>
            </div>
          ) : (
            <>
              {currentView === "dashboard" && (
                <Dashboard 
                  user={user}
                  customers={customers} 
                  tasks={tasks} 
                  meetings={meetings} 
                  sales={sales} 
                  onNavigate={setCurrentView}
                  onAddTask={handleAddTask}
                  onToggleTask={handleToggleTask}
                />
              )}
              {currentView === "chat" && (
                <ChatAssistant 
                  chatMessages={chatMessages}
                  onSendMessage={handleSendMessage}
                  isSending={isSendingChat}
                  onClearHistory={handleClearChatHistory}
                />
              )}
              {currentView === "crm" && (
                <CustomerManager 
                  customers={customers} 
                  onAddCustomer={handleAddCustomer}
                  onEditCustomer={handleEditCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                  onAddInteraction={handleAddInteraction}
                />
              )}
              {currentView === "calendar" && (
                <CalendarScheduler 
                  meetings={meetings} 
                  customers={customers} 
                  onAddMeeting={handleAddMeeting}
                  onEditMeeting={handleEditMeeting}
                  onDeleteMeeting={handleDeleteMeeting}
                />
              )}
              {currentView === "email" && (
                <EmailAssistant customers={customers} />
              )}
              {currentView === "reports" && (
                <BusinessReports 
                  customers={customers} 
                  tasks={tasks} 
                  meetings={meetings} 
                  sales={sales} 
                />
              )}
              {currentView === "settings" && (
                <Settings 
                  user={user} 
                  onUpdateProfile={handleUpdateProfile}
                  onLogout={handleLogout}
                  darkMode={darkMode}
                  onToggleDarkMode={handleToggleDarkMode}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
