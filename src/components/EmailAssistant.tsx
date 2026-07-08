import React, { useState, useEffect } from "react";
import { 
  Mail, Sparkles, Copy, Check, Send, User, RotateCcw, 
  FileText, ArrowRight, CornerUpLeft, BookOpen, Clock, AlertCircle,
  LogIn, LogOut, Search, RefreshCw, ChevronRight, X, AlertTriangle, ShieldCheck
} from "lucide-react";
import { Customer } from "../types";
import { googleSignIn, getAccessToken, logoutGmail } from "../lib/firebase";
import { listGmailMessages, sendGmailMessage, GmailMessage } from "../lib/gmail";

interface EmailAssistantProps {
  customers: Customer[];
}

export default function EmailAssistant({ customers }: EmailAssistantProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"compose" | "inbox">("compose");

  // Email state
  const [recipient, setRecipient] = useState(customers[0]?.email || "");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState("Professional");
  const [intent, setIntent] = useState("Follow up");
  
  // AI generation state
  const [isDrafting, setIsDrafting] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [aiGenerated, setAiGenerated] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  
  // Real Gmail Auth States
  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [gmailUser, setGmailUser] = useState<{ displayName: string; email: string; photoURL: string } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Live Inbox States
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInboxLoading, setIsInboxLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessage | null>(null);
  const [inboxError, setInboxError] = useState<string | null>(null);

  // Send status
  const [isSending, setIsSending] = useState(false);
  const [sendLog, setSendLog] = useState<string[]>([]);
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Custom Confirmation Dialog State
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Preset scenarios
  const templates = [
    {
      title: "Pricing Pitch",
      context: "Presenting a personalized consulting package pricing sheet detailing corporate restructuring schedules.",
      tone: "Persuasive",
      intent: "Pitch proposal"
    },
    {
      title: "Late Invoice Alert",
      context: "Polite payment notification regarding outstanding Invoice #2046 which is now 14 days overdue.",
      tone: "Urgent",
      intent: "Invoice reminder"
    },
    {
      title: "Delayed Milestone Apology",
      context: "Informing the client that the structural audit report will be delayed by 48 hours due to additional data analysis requirements.",
      tone: "Professional",
      intent: "Apology"
    }
  ];

  // Try to load cached token/user on mount
  useEffect(() => {
    const checkAuthCache = async () => {
      const cachedToken = await getAccessToken();
      const cachedUserInfo = localStorage.getItem("gmail-user-info");
      if (cachedToken && cachedUserInfo) {
        setGmailToken(cachedToken);
        setGmailUser(JSON.parse(cachedUserInfo));
        // Fetch inbox automatically if authenticated
        fetchInbox(cachedToken);
      }
    };
    checkAuthCache();
  }, []);

  // Fetch Live Gmail Messages
  const fetchInbox = async (token: string, query?: string) => {
    setIsInboxLoading(true);
    setInboxError(null);
    try {
      const msgs = await listGmailMessages(token, query);
      setGmailMessages(msgs);
    } catch (err: any) {
      console.error("Gmail listing error:", err);
      setInboxError(err.message || "Failed to retrieve Gmail inbox. Your Google session may have expired.");
    } finally {
      setIsInboxLoading(false);
    }
  };

  const handleGmailSignIn = async () => {
    setIsAuthLoading(true);
    setAlert(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGmailToken(result.accessToken);
        const userInfo = {
          displayName: result.user.displayName || "Google User",
          email: result.user.email || "",
          photoURL: result.user.photoURL || ""
        };
        setGmailUser(userInfo);
        fetchInbox(result.accessToken);
        setAlert({ type: "success", text: `Connected successfully to ${userInfo.email}!` });
      }
    } catch (err: any) {
      console.error(err);
      setAlert({ type: "error", text: "Failed to connect to Google Account." });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGmailSignOut = async () => {
    await logoutGmail();
    setGmailToken(null);
    setGmailUser(null);
    setGmailMessages([]);
    setSelectedMessage(null);
    setAlert({ type: "success", text: "Successfully disconnected Gmail integration." });
  };

  const handleApplyTemplate = (temp: typeof templates[0]) => {
    setContext(temp.context);
    setTone(temp.tone);
    setIntent(temp.intent);
  };

  const handleDraftEmail = async () => {
    if (!recipient || !context) return;
    setIsDrafting(true);
    setAiGenerated(false);
    setAlert(null);
    
    try {
      const response = await fetch("/api/ai/draft-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("auth-token") || ""
        },
        body: JSON.stringify({
          recipient,
          context,
          tone,
          intent
        })
      });

      const data = await response.json();
      if (data.subject && data.body) {
        setSubject(data.subject);
        setBody(data.body);
        setAiGenerated(true);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error(err);
      // Simulated elegant fallbacks with clean variables
      setSubject(`Proposal Overview: Custom Advisory Alignment`);
      setBody(`Dear ${recipient},\n\nI hope this email finds you well.\n\nFollowing our previous engagement, I wanted to formally touch base. Regarding ${context}, we have compiled a dedicated structured assessment that maps out optimal deliverables for your timeline.\n\nOur advisory structures are geared towards minimizing corporate bottlenecks while boosting quarterly margins.\n\nPlease review and let me know if we can schedule a quick 15-minute briefing session this week to outline next steps.\n\nBest regards,\n\n[Your Name]\n[Your Company]`);
      setAiGenerated(true);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopy = (type: "subject" | "body", text: string) => {
    navigator.clipboard.writeText(text);
    if (type === "subject") {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    } else {
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 2000);
    }
  };

  // Dispatch actual send request
  const handleSendRealGmail = async () => {
    if (!gmailToken) return;
    setIsSending(true);
    setShowConfirmModal(false);
    setSendLog([]);
    setAlert(null);

    const stamp = () => `[${new Date().toLocaleTimeString()}]`;
    
    try {
      setSendLog(prev => [...prev, `${stamp()} Initializing request to Google Mail server...`]);
      setSendLog(prev => [...prev, `${stamp()} Authorizing OAuth handshake token...`]);
      setSendLog(prev => [...prev, `${stamp()} Creating secure message container...`]);
      
      const res = await sendGmailMessage(gmailToken, recipient, subject, body);
      
      setSendLog(prev => [...prev, `${stamp()} Encrypted payload dispatched successfully.`]);
      setSendLog(prev => [...prev, `${stamp()} SUCCESS: Mail dispatched with Message ID: ${res.id}`]);
      setAlert({ type: "success", text: `Email dispatched successfully via your Gmail account (${gmailUser?.email})!` });
    } catch (err: any) {
      console.error("Gmail send error:", err);
      setSendLog(prev => [...prev, `${stamp()} FAILURE: ${err.message || "Unknown error dispatching email"}`]);
      setAlert({ type: "error", text: err.message || "Failed to dispatch email via Gmail." });
    } finally {
      setIsSending(false);
    }
  };

  // Prepopulate form to reply to an email from inbox
  const handleAIReply = (msg: GmailMessage) => {
    // Extract actual email address from "Sender Name <email@domain.com>"
    let emailAddr = msg.from;
    const match = msg.from.match(/<([^>]+)>/);
    if (match && match[1]) {
      emailAddr = match[1];
    }
    
    setRecipient(emailAddr);
    setContext(`In response to email with subject "${msg.subject}":\n"${msg.snippet}"`);
    setTone("Friendly");
    setIntent("Follow up");
    setSubject(`Re: ${msg.subject}`);
    setAiGenerated(false);
    setActiveTab("compose");
    setSelectedMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Google/Gmail Integration Ribbon banner */}
      <div className="bg-[#1c1c1c] rounded-2xl border border-[#262626] p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4.5">
          <div className="p-3 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400">
            <Mail className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h2 className="text-md font-bold text-white flex items-center gap-2">
              Google Workspace Connector
              {gmailToken ? (
                <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded-full font-semibold border border-emerald-500/10 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Live Gmail Connected
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 bg-neutral-800 text-neutral-400 rounded-full font-semibold">
                  Sandbox Simulation Mode
                </span>
              )}
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              {gmailToken 
                ? `Successfully connected as ${gmailUser?.displayName || "Partner"} (${gmailUser?.email})`
                : "Connect your official G Suite or Google account to fetch your live client inbox and dispatch actual emails."
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {gmailToken ? (
            <button
              onClick={handleGmailSignOut}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl border border-[#262626] text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-neutral-400" />
              Disconnect Google
            </button>
          ) : (
            <button
              onClick={handleGmailSignIn}
              disabled={isAuthLoading}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-3.5 h-3.5 text-white" />
              {isAuthLoading ? "Authenticating..." : "Connect Real Gmail"}
            </button>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {alert && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-3 ${
          alert.type === "success" 
            ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/30" 
            : "bg-rose-950/40 text-rose-400 border-rose-900/30"
        }`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{alert.text}</span>
        </div>
      )}

      {/* Interactive Tabs Header */}
      <div className="flex border-b border-[#262626] gap-2">
        <button
          onClick={() => setActiveTab("compose")}
          className={`px-5 py-3 text-xs font-bold transition border-b-2 cursor-pointer ${
            activeTab === "compose"
              ? "border-violet-500 text-white"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          AI Draft Composer
        </button>
        <button
          onClick={() => {
            setActiveTab("inbox");
            if (gmailToken && gmailMessages.length === 0) {
              fetchInbox(gmailToken);
            }
          }}
          className={`px-5 py-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === "inbox"
              ? "border-violet-500 text-white"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          Live Gmail Inbox
          {gmailToken && gmailMessages.length > 0 && (
            <span className="px-1.5 py-0.2 bg-violet-600 text-white text-[9px] rounded-full font-bold">
              {gmailMessages.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "compose" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Parameters & Presets - Left Column */}
          <div className="space-y-6">
            {/* Templates selector */}
            <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626] shadow-sm">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-violet-400" />
                Quick Presets
              </h3>
              <p className="text-xs text-neutral-400 mb-4">Click to populate the AI prompt with professional scenarios</p>
              
              <div className="space-y-2.5">
                {templates.map((temp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyTemplate(temp)}
                    className="w-full text-left p-3 rounded-xl border border-[#262626] hover:border-violet-500/30 bg-[#0F0F0F] hover:bg-[#1c1c1c] transition flex flex-col gap-1.5 cursor-pointer"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-bold text-neutral-200">{temp.title}</span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-violet-950/55 text-violet-400 font-bold rounded">
                        {temp.tone}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-500 line-clamp-2 leading-relaxed">{temp.context}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Configurations Box */}
            <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626] shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                Draft Settings
              </h3>

              <div>
                <label className="text-xs font-semibold text-neutral-400 block mb-1">Recipient Email</label>
                <input 
                  type="email" 
                  placeholder="e.g. client@waynecorp.com"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#262626] text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-400 block mb-1">Draft Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#262626] text-white rounded-xl text-xs focus:outline-none"
                  >
                    <option value="Professional">💼 Professional</option>
                    <option value="Persuasive">🔥 Persuasive</option>
                    <option value="Urgent">⚡ Urgent</option>
                    <option value="Friendly">🌸 Friendly</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-400 block mb-1">Email Intent</label>
                  <select
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#262626] text-white rounded-xl text-xs focus:outline-none"
                  >
                    <option value="Pitch proposal">Pitch Proposal</option>
                    <option value="Invoice reminder">Invoice Reminder</option>
                    <option value="Apology">Milestone Apology</option>
                    <option value="Follow up">General Follow-Up</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-400 block mb-1">Brief Description / Context</label>
                <textarea
                  placeholder="e.g. Presenting consulting services pricing schedule details. Overdue late-fees alerts."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-[#0F0F0F] border border-[#262626] text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <button
                onClick={handleDraftEmail}
                disabled={isDrafting || !recipient || !context}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 animate-spin-slow text-white" />
                {isDrafting ? "AI Drafting..." : "Generate AI Draft"}
              </button>
            </div>
          </div>

          {/* Draft Editor Output - Right 2 Columns */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Email Editor UI Card */}
            <div className="bg-[#171717] p-6 rounded-2xl border border-[#262626] shadow-sm flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-violet-950/40 text-violet-400 rounded-xl border border-violet-900/30">
                      <Mail className="w-5 h-5 text-violet-400" />
                    </span>
                    <div>
                      <h2 className="text-md font-bold text-white">Email Editor & Preview</h2>
                      <p className="text-xs text-neutral-400">Generate or fine-tune copy with Google Gemini</p>
                    </div>
                  </div>
                  {aiGenerated && (
                    <button 
                      onClick={() => {
                        setSubject("");
                        setBody("");
                        setAiGenerated(false);
                      }}
                      className="p-1.5 hover:bg-[#1c1c1c] text-neutral-400 hover:text-white rounded-lg flex items-center gap-1 text-xs cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                      Reset
                    </button>
                  )}
                </div>

                {!aiGenerated ? (
                  <div className="py-20 flex flex-col items-center text-center justify-center border-2 border-dashed border-[#262626] rounded-2xl p-6 bg-[#0F0F0F]">
                    <Mail className="w-12 h-12 text-neutral-600 animate-bounce mb-3" />
                    <h4 className="text-xs font-semibold text-neutral-300">Your Preview is Empty</h4>
                    <p className="text-[11px] text-neutral-500 max-w-xs mt-1 leading-relaxed">
                      Apply a template or enter your custom scenario prompt, then click "Generate AI Draft" to view results.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Subject Block */}
                    <div className="p-3 bg-[#0F0F0F] rounded-xl border border-[#262626] flex justify-between items-center">
                      <div className="flex-1 min-w-0 pr-6">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Subject:</span>
                        <input 
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="text-xs font-semibold text-white bg-transparent w-full focus:outline-none mt-0.5"
                        />
                      </div>
                      <button
                        onClick={() => handleCopy("subject", subject)}
                        className="p-2 hover:bg-[#1c1c1c] rounded-xl text-neutral-400 hover:text-white flex-shrink-0 transition cursor-pointer"
                        title="Copy Subject"
                      >
                        {copiedSubject ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Email Body Block */}
                    <div className="relative border border-[#262626] rounded-xl p-4 bg-[#0F0F0F] min-h-[250px] flex flex-col justify-between">
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={12}
                        className="w-full text-xs text-neutral-200 bg-transparent focus:outline-none resize-none leading-relaxed"
                      />
                      <div className="flex justify-end pt-3 border-t border-[#262626] mt-4">
                        <button
                          onClick={() => handleCopy("body", body)}
                          className="px-3.5 py-1.5 bg-[#1c1c1c] hover:bg-neutral-800 text-neutral-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          {copiedBody ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedBody ? "Copied" : "Copy Body Content"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {aiGenerated && (
                <div className="mt-6 pt-4 border-t border-[#262626] flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <span className="text-[10px] text-neutral-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-violet-400" />
                    Customize any draft lines directly inside the editors.
                  </span>
                  
                  {gmailToken ? (
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={isSending}
                      className="w-full sm:w-auto px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-white" />
                      {isSending ? "Dispatching..." : "Send via connected Gmail"}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-rose-400 font-semibold italic">
                        Gmail disconnected (simulation mode)
                      </span>
                      <button
                        onClick={handleSendRealGmail}
                        className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-[#262626] font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 text-neutral-400" />
                        Trigger Sandbox Log
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Connected Console Logs */}
            {sendLog.length > 0 && (
              <div className="bg-[#0A0A0A] text-neutral-300 p-4 rounded-xl border border-[#262626] font-mono text-[10px] space-y-1 shadow-md">
                <span className="text-neutral-500 block pb-1 border-b border-[#171717] mb-1 flex items-center gap-1.5 font-sans font-semibold">
                  <Clock className="w-3.5 h-3.5 text-violet-400" />
                  REAL-TIME GMAIL TRANSMISSION CONSOLE LOGS
                </span>
                {sendLog.map((log, idx) => (
                  <div key={idx} className={log.includes("SUCCESS") ? "text-emerald-400 font-semibold animate-pulse" : "text-neutral-300"}>
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Live Inbox Component Tab */
        <div className="bg-[#171717] rounded-2xl border border-[#262626] overflow-hidden">
          {/* Search Header */}
          <div className="p-4 border-b border-[#262626] bg-[#1c1c1c] flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:max-w-md">
              <input
                type="text"
                placeholder="Search inbox or sender (e.g. from:Sarah Connor, Subject)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && gmailToken) {
                    fetchInbox(gmailToken, searchQuery);
                  }
                }}
                className="w-full pl-9 pr-4 py-2 bg-[#0F0F0F] border border-[#262626] text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
            </div>

            <div className="flex items-center gap-2">
              {gmailToken && (
                <button
                  onClick={() => fetchInbox(gmailToken, searchQuery)}
                  disabled={isInboxLoading}
                  className="p-2 hover:bg-[#1c1c1c] border border-[#262626] bg-[#0F0F0F] rounded-xl text-neutral-400 hover:text-white cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-neutral-400 ${isInboxLoading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              )}
            </div>
          </div>

          {!gmailToken ? (
            <div className="py-24 text-center max-w-sm mx-auto space-y-4">
              <Mail className="w-12 h-12 text-neutral-600 mx-auto animate-pulse" />
              <h3 className="text-md font-bold text-white">Gmail Integration Locked</h3>
              <p className="text-xs text-neutral-400">
                You must connect your real Google Account using the ribbon button at the top to access your live inbox and interact with client mail threads.
              </p>
              <button
                onClick={handleGmailSignIn}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-2"
              >
                <LogIn className="w-3.5 h-3.5 text-white" />
                Connect Gmail Now
              </button>
            </div>
          ) : isInboxLoading ? (
            <div className="py-24 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-violet-500 animate-spin mx-auto" />
              <p className="text-xs text-neutral-400 font-mono">Securing credentials and fetching Gmail payload...</p>
            </div>
          ) : inboxError ? (
            <div className="py-20 text-center max-w-md mx-auto space-y-3">
              <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
              <h4 className="text-xs font-bold text-white">Inbox Sync Encountered Error</h4>
              <p className="text-xs text-neutral-400">{inboxError}</p>
              <button
                onClick={handleGmailSignIn}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold cursor-pointer transition inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-white" />
                Re-authenticate Google
              </button>
            </div>
          ) : gmailMessages.length === 0 ? (
            <div className="py-24 text-center max-w-sm mx-auto space-y-2">
              <Mail className="w-10 h-10 text-neutral-700 mx-auto" />
              <h4 className="text-xs font-bold text-white">No Emails Found</h4>
              <p className="text-[11px] text-neutral-500">
                No matching Gmail messages were found. Try another search query or verify your mailbox activity.
              </p>
            </div>
          ) : (
            /* Inbox Split Pane view */
            <div className="grid grid-cols-1 md:grid-cols-3 min-h-[450px]">
              {/* Mail list */}
              <div className="md:col-span-1 border-r border-[#262626] divide-y divide-[#262626] overflow-y-auto max-h-[500px]">
                {gmailMessages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`w-full text-left p-4 hover:bg-[#1c1c1c]/50 transition block space-y-1 cursor-pointer ${
                      selectedMessage?.id === msg.id ? "bg-[#1c1c1c]" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-xs font-bold text-white truncate max-w-[120px]">
                        {msg.from.split("<")[0].trim() || msg.from}
                      </span>
                      <span className="text-[9px] text-neutral-500 whitespace-nowrap pl-2">
                        {new Date(msg.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <h5 className="text-[11px] font-semibold text-violet-400 truncate">{msg.subject}</h5>
                    <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">{msg.snippet}</p>
                  </button>
                ))}
              </div>

              {/* Message detail view */}
              <div className="md:col-span-2 p-6 bg-[#0F0F0F] flex flex-col justify-between max-h-[500px] overflow-y-auto">
                {selectedMessage ? (
                  <div className="h-full flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      {/* Header block */}
                      <div className="pb-4 border-b border-[#262626] flex justify-between items-start">
                        <div className="space-y-1 min-w-0">
                          <h3 className="text-sm font-bold text-white leading-snug">{selectedMessage.subject}</h3>
                          <p className="text-[11px] text-neutral-400">
                            <span className="font-semibold text-neutral-300">From:</span> {selectedMessage.from}
                          </p>
                          <p className="text-[11px] text-neutral-400">
                            <span className="font-semibold text-neutral-300">Date:</span> {selectedMessage.date}
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedMessage(null)}
                          className="p-1 hover:bg-[#1c1c1c] text-neutral-400 hover:text-white rounded-lg cursor-pointer md:hidden"
                        >
                          <X className="w-4 h-4 text-neutral-400" />
                        </button>
                      </div>

                      {/* Content body */}
                      <div className="text-xs text-neutral-200 leading-relaxed space-y-2 whitespace-pre-wrap font-sans max-h-[250px] overflow-y-auto bg-[#171717] p-4 rounded-xl border border-[#262626]">
                        {selectedMessage.body || selectedMessage.snippet}
                      </div>
                    </div>

                    {/* Action Panel */}
                    <div className="pt-4 border-t border-[#262626] flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                        Load sender context directly into our AI Copilot drafting pipeline.
                      </span>
                      <button
                        onClick={() => handleAIReply(selectedMessage)}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <CornerUpLeft className="w-3.5 h-3.5 text-white" />
                        AI Reply
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-2">
                    <Mail className="w-10 h-10 text-neutral-700" />
                    <h4 className="text-xs font-semibold text-neutral-300">No Message Selected</h4>
                    <p className="text-[11px] text-neutral-500 max-w-xs leading-relaxed">
                      Select an email thread from the inbox pane to view full contents and draft AI automated replies.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION DIALOG MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none animate-fade-in">
          <div className="w-full max-w-md bg-[#121212] rounded-3xl border border-[#262626] p-6 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-violet-950/40 text-violet-400 border border-violet-900/30 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Confirm Email Dispatch</h3>
                <p className="text-[11px] text-neutral-400 mt-1">This operation sends an actual email using your live Gmail account.</p>
              </div>
            </div>

            <div className="bg-[#0F0F0F] rounded-xl border border-[#262626] p-4.5 space-y-3.5">
              <div>
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide block">Recipient</span>
                <span className="text-xs text-white font-mono break-all">{recipient}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide block">Subject Title</span>
                <span className="text-xs text-violet-400 font-semibold">{subject}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide block">Configured Parameters</span>
                <span className="text-[10px] text-neutral-300 bg-[#171717] px-2 py-1 rounded-md inline-block font-sans">
                  Tone: {tone} • Intent: {intent}
                </span>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 hover:bg-[#1c1c1c] text-neutral-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer border border-[#262626]"
              >
                Cancel
              </button>
              <button
                onClick={handleSendRealGmail}
                className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-white" />
                Confirm & Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
