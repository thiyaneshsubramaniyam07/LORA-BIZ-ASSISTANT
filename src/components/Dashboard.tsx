import React, { useState } from "react";
import { 
  TrendingUp, TrendingDown, DollarSign, Users, CheckSquare, Calendar, 
  AlertCircle, ArrowUpRight, Plus, Sparkles, Check, Clock, User
} from "lucide-react";
import { Customer, Task, Meeting, SalesRecord } from "../types";

interface DashboardProps {
  user: any;
  customers: Customer[];
  tasks: Task[];
  meetings: Meeting[];
  sales: SalesRecord[];
  onNavigate: (view: string) => void;
  onAddTask: (task: Omit<Task, "id" | "status">) => void;
  onToggleTask: (id: string, status: "Pending" | "Completed") => void;
}

export default function Dashboard({ 
  user, customers, tasks, meetings, sales, onNavigate, onAddTask, onToggleTask 
}: DashboardProps) {
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskPriority, setQuickTaskPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);

  // Math metrics
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === "Active").length;
  const pendingTasks = tasks.filter(t => t.status === "Pending");
  const highPriorityPending = pendingTasks.filter(t => t.priority === "High").length;
  const meetingsToday = meetings.filter(m => {
    const today = new Date().toISOString().split("T")[0];
    return m.date === today;
  });

  // Calculate recent financial metrics (e.g. June/July records)
  const currentSalesMonth = sales[sales.length - 1] || { revenue: 0, expenses: 0 };
  const prevSalesMonth = sales[sales.length - 2] || { revenue: 0, expenses: 0 };
  
  const revenueTrend = currentSalesMonth.revenue >= prevSalesMonth.revenue;
  const totalRevenue = sales.reduce((acc, s) => acc + s.revenue, 0);
  const totalExpenses = sales.reduce((acc, s) => acc + s.expenses, 0);
  const netProfit = totalRevenue - totalExpenses;

  const handleQuickTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    onAddTask({
      title: quickTaskTitle,
      priority: quickTaskPriority,
      dueDate: new Date().toISOString().split("T")[0]
    });
    setQuickTaskTitle("");
  };

  // SVG Chart rendering parameters
  const maxVal = Math.max(...sales.map(s => Math.max(s.revenue, s.expenses))) * 1.15 || 25000;
  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 30;

  // Generate SVG Points for Line/Area Chart
  const getPoints = (key: 'revenue' | 'expenses') => {
    const totalPoints = sales.length;
    return sales.map((s, i) => {
      const x = padding + (i / (totalPoints - 1)) * (chartWidth - padding * 2);
      const y = chartHeight - padding - (s[key] / maxVal) * (chartHeight - padding * 2);
      return `${x},${y}`;
    }).join(" ");
  };

  const getAreaPoints = (key: 'revenue' | 'expenses') => {
    const totalPoints = sales.length;
    const pts = getPoints(key);
    if (!pts) return "";
    const firstX = padding;
    const lastX = padding + (totalPoints - 1) / (totalPoints - 1) * (chartWidth - padding * 2);
    const bottomY = chartHeight - padding;
    return `${firstX},${bottomY} ${pts} ${lastX},${bottomY}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Profile Summary */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#171717] p-6 rounded-2xl border border-[#262626]">
        <div>
          <h1 className="text-xl font-display font-bold text-white tracking-tight">
            Welcome back, <span className="text-violet-400">{user.name}</span> 👋
          </h1>
          <p className="text-xs text-neutral-400 mt-1 font-sans">
            Here's the status of <span className="font-semibold text-white">{user.companyName}</span> for today, July 8, 2026.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate("chat")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
            id="dashboard-ai-consult-btn"
          >
            <Sparkles className="w-4 h-4 text-white" />
            AI Quick Chat
          </button>
          <button 
            onClick={() => onNavigate("reports")}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold border border-neutral-700 transition cursor-pointer"
            id="dashboard-analytics-btn"
          >
            Advisory Insights
          </button>
        </div>
      </div>

      {/* Analytics Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <div className="glass-card hover:border-neutral-700 transition">
          <div className="flex justify-between items-start">
            <span className="p-2.5 bg-violet-950/40 text-violet-400 rounded-xl border border-violet-900/30">
              <DollarSign className="w-4 h-4" />
            </span>
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${revenueTrend ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/40' : 'bg-rose-950/50 text-rose-400 border border-rose-900/40'}`}>
              {revenueTrend ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {revenueTrend ? "+12%" : "-4%"}
            </span>
          </div>
          <div className="mt-4">
            <p className="muted-text mb-1">Total Gross Revenue</p>
            <div className="stat-value">
              ${totalRevenue.toLocaleString()}
            </div>
            <p className="text-[10px] text-neutral-500 mt-2">Accumulated history</p>
          </div>
        </div>

        {/* Card 2: Net Profit */}
        <div className="glass-card hover:border-neutral-700 transition">
          <div className="flex justify-between items-start">
            <span className="p-2.5 bg-emerald-950/40 text-emerald-400 rounded-xl border border-emerald-900/30">
              <DollarSign className="w-4 h-4" />
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-900/40">
              <TrendingUp className="w-3 h-3" />
              +8.5%
            </span>
          </div>
          <div className="mt-4">
            <p className="muted-text mb-1">Net Margin</p>
            <div className="stat-value">
              ${netProfit.toLocaleString()}
            </div>
            <p className="text-[10px] text-neutral-500 mt-2">Expenses: ${totalExpenses.toLocaleString()}</p>
          </div>
        </div>

        {/* Card 3: CRM Contacts */}
        <div className="glass-card hover:border-neutral-700 transition">
          <div className="flex justify-between items-start">
            <span className="p-2.5 bg-indigo-950/40 text-indigo-400 rounded-xl border border-indigo-900/30">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-[10px] text-indigo-400 bg-indigo-950/50 border border-indigo-900/40 px-2 py-0.5 rounded-full font-bold">
              {activeCustomers} Active
            </span>
          </div>
          <div className="mt-4">
            <p className="muted-text mb-1">Active CRM Accounts</p>
            <div className="stat-value">
              {totalCustomers}
            </div>
            <p className="text-[10px] text-neutral-500 mt-2">Leads waiting: {totalCustomers - activeCustomers}</p>
          </div>
        </div>

        {/* Card 4: Operations Pending */}
        <div className="glass-card bg-violet-900/10 border-violet-500/30 hover:border-violet-500/50 transition">
          <div className="flex justify-between items-start">
            <span className="p-2.5 bg-amber-950/40 text-amber-400 rounded-xl border border-amber-900/30">
              <CheckSquare className="w-4 h-4" />
            </span>
            {highPriorityPending > 0 && (
              <span className="text-[10px] text-rose-400 bg-rose-950/50 border border-rose-900/40 px-2 py-0.5 rounded-full font-bold">
                {highPriorityPending} Urgent
              </span>
            )}
          </div>
          <div className="mt-4">
            <p className="muted-text mb-1 text-violet-400">Operations Pending</p>
            <div className="stat-value text-white">
              {pendingTasks.length}
            </div>
            <p className="text-[10px] text-violet-400 mt-2">Completed today: {tasks.filter(t => t.status === "Completed").length}</p>
          </div>
        </div>
      </div>

      {/* Main Core Section: Charts and Calendar Sync */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Financial Charts and Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Chart */}
          <div className="glass-card">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className="text-violet-500">✦</span> Revenue & Expenses Outlook
                </h2>
                <p className="text-[10px] text-neutral-400 mt-0.5">Performance index over last {sales.length} months</p>
              </div>
              <div className="flex gap-4 text-[11px] font-semibold">
                <span className="flex items-center gap-1.5 text-neutral-300">
                  <span className="w-2 h-2 rounded-full bg-violet-500 block animate-pulse"></span>
                  Gross Revenue
                </span>
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <span className="w-2 h-2 rounded-full bg-neutral-600 block"></span>
                  Expenses
                </span>
              </div>
            </div>

            {/* Custom Responsive SVG Chart */}
            <div className="w-full relative mt-4">
              <svg 
                viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                className="w-full h-auto overflow-visible select-none"
              >
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = padding + ratio * (chartHeight - padding * 2);
                  const labelVal = Math.round(maxVal * (1 - ratio));
                  return (
                    <g key={idx}>
                      <line 
                        x1={padding} 
                        y1={y} 
                        x2={chartWidth - padding} 
                        y2={y} 
                        stroke="#262626" 
                        strokeWidth="1" 
                        strokeDasharray="4,4"
                      />
                      <text 
                        x={padding - 5} 
                        y={y + 4} 
                        fontSize="8" 
                        textAnchor="end" 
                        fill="#737373"
                        className="font-mono"
                      >
                        ${labelVal >= 1000 ? (labelVal / 1000).toFixed(1) + "k" : labelVal}
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Labels */}
                {sales.map((s, i) => {
                  const x = padding + (i / (sales.length - 1)) * (chartWidth - padding * 2);
                  return (
                    <text 
                      key={i} 
                      x={x} 
                      y={chartHeight - 5} 
                      fontSize="9" 
                      textAnchor="middle" 
                      fill="#737373"
                      className="font-sans font-medium"
                    >
                      {s.month}
                    </text>
                  );
                })}

                {/* Shaded Area for Revenue */}
                <polygon 
                  points={getAreaPoints('revenue')} 
                  fill="url(#revGrad)" 
                  opacity="0.12" 
                />

                {/* Revenue Line */}
                <polyline 
                  fill="none" 
                  stroke="#8B5CF6" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  points={getPoints('revenue')} 
                />

                {/* Expenses Line */}
                <polyline 
                  fill="none" 
                  stroke="#404040" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  points={getPoints('expenses')} 
                />

                {/* Interaction Hotspots (Circles) */}
                {sales.map((s, i) => {
                  const x = padding + (i / (sales.length - 1)) * (chartWidth - padding * 2);
                  const ry = chartHeight - padding - (s.revenue / maxVal) * (chartHeight - padding * 2);
                  const ey = chartHeight - padding - (s.expenses / maxVal) * (chartHeight - padding * 2);
                  const isHovered = hoveredMonth === s.month;

                  return (
                    <g key={i}>
                      {/* Revenue point */}
                      <circle 
                        cx={x} 
                        cy={ry} 
                        r={isHovered ? 5 : 3.5} 
                        fill="#8B5CF6" 
                        stroke="#171717" 
                        strokeWidth="1.5"
                        onMouseEnter={() => setHoveredMonth(s.month)}
                        onMouseLeave={() => setHoveredMonth(null)}
                        className="cursor-pointer transition-all duration-150"
                      />
                      {/* Expenses point */}
                      <circle 
                        cx={x} 
                        cy={ey} 
                        r={isHovered ? 5 : 3.5} 
                        fill="#404040" 
                        stroke="#171717" 
                        strokeWidth="1.5"
                        onMouseEnter={() => setHoveredMonth(s.month)}
                        onMouseLeave={() => setHoveredMonth(null)}
                        className="cursor-pointer transition-all duration-150"
                      />
                    </g>
                  );
                })}

                {/* Gradients */}
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Float value popover on Hover */}
              {hoveredMonth && (
                <div className="absolute top-2 right-4 bg-[#171717] text-white text-[11px] p-2.5 rounded-xl shadow-lg border border-[#262626] backdrop-blur-sm flex flex-col gap-1 font-mono">
                  <span className="font-sans font-semibold text-neutral-300">{hoveredMonth} Summary:</span>
                  <div className="flex gap-3">
                    <span className="text-emerald-400">Rev: ${sales.find(s => s.month === hoveredMonth)?.revenue.toLocaleString()}</span>
                    <span className="text-neutral-400">Exp: ${sales.find(s => s.month === hoveredMonth)?.expenses.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Core Checklist/Tasks widget */}
          <div className="glass-card">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-display font-semibold text-slate-900 dark:text-white">Today's Task Queue</h2>
                <p className="text-xs text-slate-400 mt-0.5">Quickly view or add standard operational targets</p>
              </div>
              <button 
                onClick={() => onNavigate("tasks")}
                className="text-xs text-violet-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                Go to Task Manager
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick add form */}
            <form onSubmit={handleQuickTaskSubmit} className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="What operational milestone needs completion?" 
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                className="flex-1 px-4 py-2 bg-[#0F0F0F] border border-[#262626] text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
              <select 
                value={quickTaskPriority}
                onChange={(e: any) => setQuickTaskPriority(e.target.value)}
                className="px-3 py-2 bg-[#0F0F0F] border border-[#262626] text-white rounded-xl text-sm focus:outline-none"
              >
                <option value="High" className="bg-[#171717]">🔥 High</option>
                <option value="Medium" className="bg-[#171717]">⚡ Mid</option>
                <option value="Low" className="bg-[#171717]">🌱 Low</option>
              </select>
              <button 
                type="submit" 
                className="p-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl flex items-center justify-center transition cursor-pointer"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </form>

            {/* Tasks listing */}
            <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
              {pendingTasks.length === 0 ? (
                <div className="text-center py-6 text-neutral-400 text-sm bg-[#0F0F0F] rounded-xl border border-dashed border-[#262626]">
                  <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  Your workspace is clean. Zero pending tasks.
                </div>
              ) : (
                pendingTasks.slice(0, 4).map((task) => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between p-3 bg-[#0F0F0F] rounded-xl border border-[#262626] hover:border-neutral-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => onToggleTask(task.id, "Completed")}
                        className="w-5 h-5 rounded-md border border-neutral-700 hover:border-violet-500 flex items-center justify-center bg-[#171717] transition-colors cursor-pointer"
                      >
                        <span className="w-2 h-2 bg-transparent rounded-sm"></span>
                      </button>
                      <div>
                        <span className="text-sm font-medium text-white block">{task.title}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-medium text-neutral-500">Due: {task.dueDate}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${task.priority === 'High' ? 'bg-rose-950/40 text-rose-400' : task.priority === 'Medium' ? 'bg-amber-950/40 text-amber-400' : 'bg-emerald-950/40 text-emerald-400'}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Calendar, Reminders */}
        <div className="space-y-6">
          {/* Calendar Synced meetings */}
          <div className="glass-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="text-violet-500">✦</span> Meetings Schedule
              </h2>
              <button 
                onClick={() => onNavigate("calendar")}
                className="text-xs text-violet-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                Calendar
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {meetingsToday.length > 0 && (
                <div className="bg-violet-950/20 border border-violet-900/30 p-3 rounded-xl mb-1">
                  <span className="text-xs font-semibold text-violet-400 block">Today's Focus:</span>
                  <p className="text-[11px] text-violet-300 mt-0.5">You have {meetingsToday.length} consult sessions slated for today.</p>
                </div>
              )}

              {meetings.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-sm border border-dashed border-[#262626] rounded-xl">
                  No upcoming meetings.
                </div>
              ) : (
                meetings.slice(0, 3).map((meet) => (
                  <div 
                    key={meet.id} 
                    className="p-3 bg-[#0F0F0F] rounded-xl border border-[#262626] flex items-start gap-3 hover:border-neutral-700 transition"
                  >
                    <div className="p-2 bg-violet-950/40 text-violet-400 rounded-lg border border-violet-900/30">
                      <Calendar className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">{meet.title}</h4>
                      <p className="text-xs text-neutral-400 mt-0.5 truncate flex items-center gap-1.5">
                        <User className="w-3 h-3 flex-shrink-0 text-neutral-500" />
                        {meet.clientName}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-neutral-500 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{meet.date} at {meet.time} ({meet.duration}m)</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Automated System Reminders */}
          <div className="bg-gradient-to-br from-[#171717] to-violet-950/10 text-white p-6 rounded-2xl border border-[#262626] shadow-md">
            <h2 className="text-sm font-display font-semibold text-violet-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-violet-400 animate-pulse" />
              AI Copilot Reminders
            </h2>
            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-start gap-2.5 pb-3 border-b border-[#262626]">
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full mt-1.5 block flex-shrink-0"></span>
                <div>
                  <p className="font-semibold text-neutral-200">Quote Draft Pending</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Tony Stark requested a customized price quota. Deadline is today by EOD.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 pb-3 border-b border-[#262626]">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 block flex-shrink-0"></span>
                <div>
                  <p className="font-semibold text-neutral-200">Onboarding Kickoff Friday</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Review alignment sheets Friday morning before kick-off session with Cyberdyne.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 block flex-shrink-0"></span>
                <div>
                  <p className="font-semibold text-neutral-200">Profit Curve High</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Your monthly sales scaled 24% over last quarter. Generate your SWOT to view recommendations.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
