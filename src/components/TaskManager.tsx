import React, { useState } from "react";
import { 
  CheckSquare, Plus, Trash2, Calendar, AlertCircle, 
  Check, Filter, Search, Clock, ChevronDown, CheckCircle2, Circle
} from "lucide-react";
import { Task, Customer } from "../types";

interface TaskManagerProps {
  tasks: Task[];
  customers: Customer[];
  onAddTask: (task: Omit<Task, "id" | "status">) => Promise<void>;
  onToggleTask: (id: string, status: "Pending" | "Completed") => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

export default function TaskManager({ 
  tasks, customers, onAddTask, onToggleTask, onDeleteTask 
}: TaskManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Form States
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [assignedContactId, setAssignedContactId] = useState("");

  // Progress Calculations
  const totalTasksCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === "Completed").length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;

  // Filter Tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
    const matchesStatus = statusFilter === "All" || task.status === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onAddTask({
      title,
      priority,
      dueDate,
      assignedContactId: assignedContactId || undefined
    });

    setTitle("");
    setPriority("Medium");
    setDueDate(new Date().toISOString().split("T")[0]);
    setAssignedContactId("");
    setShowAddForm(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Filters and Progress Side panel */}
      <div className="space-y-6 lg:col-span-1">
        {/* Progress tracker */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-md font-display font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            Operations Progress
          </h3>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-semibold">Goal Accomplishment</span>
            <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">{progressPercent}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <div className="flex gap-4 mt-4 justify-between text-xs font-medium border-t border-slate-50 dark:border-slate-800 pt-4">
            <div className="text-center">
              <span className="text-slate-400 block">Total</span>
              <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">{totalTasksCount}</span>
            </div>
            <div className="text-center">
              <span className="text-emerald-500 block">Completed</span>
              <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</span>
            </div>
            <div className="text-center">
              <span className="text-blue-500 block">Pending</span>
              <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">{totalTasksCount - completedCount}</span>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-50 dark:border-slate-800">
            <Filter className="w-4 h-4 text-blue-600" />
            Filter Backlog
          </h3>

          {/* Status Filter */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Milestone Status</label>
            <div className="flex flex-col gap-1.5">
              {["All", "Pending", "Completed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    statusFilter === status 
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 font-bold" 
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Priority Scale</label>
            <div className="flex flex-col gap-1.5">
              {["All", "High", "Medium", "Low"].map((prio) => (
                <button
                  key={prio}
                  onClick={() => setPriorityFilter(prio)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    priorityFilter === prio 
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 font-bold" 
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {prio === "All" ? "All Priorities" : `${prio} Priority`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Task List panel - Right 3 Columns */}
      <div className="lg:col-span-3 space-y-4">
        {/* Search header controls */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <input 
              type="text" 
              placeholder="Search active tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          </div>

          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4" />
            Add New Task
          </button>
        </div>

        {/* --- DYNAMIC ADD FORM SLIDE-DOWN --- */}
        {showAddForm && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
            <h4 className="text-sm font-display font-bold text-slate-800 dark:text-white mb-4">
              Create New Business Milestone
            </h4>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-400 block mb-1">Task Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Conduct complete tax reporting checkup"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Priority Scale</label>
                <select 
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none"
                >
                  <option value="High">🔥 High Priority</option>
                  <option value="Medium">⚡ Medium Priority</option>
                  <option value="Low">🌱 Low Priority</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Due Date</label>
                <input 
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-400 block mb-1">Assign CRM Client Contact (Optional)</label>
                <select 
                  value={assignedContactId}
                  onChange={(e) => setAssignedContactId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none"
                >
                  <option value="">-- No Contact --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow"
                >
                  Create Milestone
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List mapping */}
        <div className="space-y-2.5">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
              <CheckSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              No tasks found matching your filter criteria.
            </div>
          ) : (
            filteredTasks.map((task) => {
              const assignedContact = customers.find(c => c.id === task.assignedContactId);
              const isCompleted = task.status === "Completed";

              return (
                <div 
                  key={task.id}
                  className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm hover:shadow-md transition flex items-center justify-between gap-4 ${
                    isCompleted ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Toggle button */}
                    <button 
                      onClick={() => onToggleTask(task.id, isCompleted ? "Pending" : "Completed")}
                      className={`w-5.5 h-5.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                        isCompleted 
                          ? "bg-blue-600 border-blue-600 text-white" 
                          : "border-slate-300 dark:border-slate-600 hover:border-blue-500 bg-white dark:bg-slate-800"
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                    </button>

                    {/* Task details */}
                    <div className="min-w-0">
                      <span className={`text-sm font-semibold text-slate-800 dark:text-slate-100 block truncate ${
                        isCompleted ? "line-through text-slate-400 dark:text-slate-500" : ""
                      }`}>
                        {task.title}
                      </span>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] font-sans">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          Due: {task.dueDate}
                        </span>
                        {assignedContact && (
                          <span className="text-slate-400 flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.2 rounded">
                            Client: <strong className="font-semibold text-slate-600 dark:text-slate-300">{assignedContact.name}</strong>
                          </span>
                        )}
                        <span className={`font-bold px-1.5 py-0.2 rounded text-[8px] uppercase tracking-wider ${
                          task.priority === 'High' 
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400' 
                            : task.priority === 'Medium' 
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' 
                              : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                        }`}>
                          {task.priority} Priority
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delete Trigger */}
                  <button 
                    onClick={() => onDeleteTask(task.id)}
                    className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 rounded-xl transition flex-shrink-0"
                    title="Delete Milestone"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
