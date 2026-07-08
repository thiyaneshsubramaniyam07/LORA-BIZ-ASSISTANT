import React, { useState } from "react";
import { 
  Calendar as CalendarIcon, Clock, Plus, Trash2, Edit3, User, 
  Sparkles, Check, ChevronLeft, ChevronRight, AlertCircle, X 
} from "lucide-react";
import { Meeting, Customer } from "../types";

interface CalendarSchedulerProps {
  meetings: Meeting[];
  customers: Customer[];
  onAddMeeting: (meeting: Omit<Meeting, "id">) => Promise<void>;
  onEditMeeting: (id: string, meeting: Partial<Meeting>) => Promise<void>;
  onDeleteMeeting: (id: string) => Promise<void>;
}

export default function CalendarScheduler({ 
  meetings, customers, onAddMeeting, onEditMeeting, onDeleteMeeting 
}: CalendarSchedulerProps) {
  // We represent July 2026. July has 31 days. 1st is Wednesday.
  const currentMonthName = "July";
  const currentYear = 2026;
  const daysInMonth = 31;
  const firstDayIndex = 3; // Wednesday (0: Sun, 1: Mon, 2: Tue, 3: Wed, ...)

  const [selectedDay, setSelectedDay] = useState<number | null>(8); // Default to July 8, 2026
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Meeting | null>(null);
  
  // Meeting form states
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Filter meetings for the selected date
  const getSelectedDateString = (day: number) => {
    return `${currentYear}-07-${day.toString().padStart(2, '0')}`;
  };

  const getMeetingsForDay = (day: number) => {
    const dateStr = getSelectedDateString(day);
    return meetings.filter(m => m.date === dateStr);
  };

  const handleOpenAddModal = (day: number) => {
    setSelectedDay(day);
    setTitle("");
    setClientName(customers[0]?.name || "");
    setTime("10:00");
    setDuration(30);
    setNotes("");
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !clientName || !selectedDay) return;

    await onAddMeeting({
      title,
      clientName,
      date: getSelectedDateString(selectedDay),
      time,
      duration,
      notes,
      aiSuggested: notes.includes("AI Suggestion")
    });
    setShowAddModal(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;

    await onEditMeeting(showEditModal.id, {
      title,
      clientName,
      time,
      duration,
      notes
    });
    setShowEditModal(null);
  };

  const handleOpenEditModal = (meet: Meeting) => {
    setTitle(meet.title);
    setClientName(meet.clientName);
    setTime(meet.time);
    setDuration(meet.duration);
    setNotes(meet.notes || "");
    setShowEditModal(meet);
  };

  // AI Meeting Suggestions generator
  const handleAiMeetingSuggestion = async () => {
    if (!clientName) return;
    setIsAiGenerating(true);
    
    try {
      // Simulate/request AI meeting brief based on client details
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("auth-token") || ""
        },
        body: JSON.stringify({
          message: `Suggest a meeting topic, agenda, and brief notes for an upcoming advisory meeting with my client: ${clientName}. Output only the meeting topic line and the agenda list.`
        })
      });

      const data = await response.json();
      if (data.text) {
        // Strip markdown and inject
        const rawText = data.text.replace(/###/g, "").replace(/\*\*/g, "").trim();
        const splitText = rawText.split("\n");
        const suggestedTitle = splitText[0] || `${clientName} Advisory Consultation`;
        
        setTitle(suggestedTitle.replace("Topic:", "").trim());
        setNotes(`AI Suggested Agenda:\n${rawText}`);
      }
    } catch (err) {
      console.error(err);
      setTitle(`${clientName} Strategic Review`);
      setNotes(`AI Suggested Agenda:\n1. Financial Growth Curves Assessment\n2. Q3 Timeline alignment\n3. Redundant overhead cost review`);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Render Days of Calendar
  const renderCalendarDays = () => {
    const days = [];
    
    // Empty blocks for offset
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`empty-${i}`} className="h-14 sm:h-20 bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/50"></div>);
    }

    // Actual calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDay === day;
      const dayMeetings = getMeetingsForDay(day);
      const isToday = day === 8; // Simulate today as July 8

      days.push(
        <div 
          key={`day-${day}`}
          onClick={() => setSelectedDay(day)}
          className={`h-14 sm:h-20 p-1.5 sm:p-2 border border-slate-100 dark:border-slate-800 flex flex-col justify-between cursor-pointer transition relative hover:bg-slate-50 dark:hover:bg-slate-800/30 ${
            isSelected ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900" : "bg-white dark:bg-slate-900"
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-[11px] sm:text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
              isToday 
                ? "bg-blue-600 text-white shadow" 
                : isSelected 
                  ? "text-blue-600 dark:text-blue-400 font-bold" 
                  : "text-slate-700 dark:text-slate-400"
            }`}>
              {day}
            </span>
            {dayMeetings.length > 0 && (
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full sm:hidden"></span>
            )}
          </div>

          {/* Desktop small meeting flags */}
          <div className="hidden sm:block space-y-1 overflow-hidden mt-1 max-h-[44px]">
            {dayMeetings.slice(0, 2).map((m) => (
              <div 
                key={m.id} 
                className="text-[9px] px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-medium truncate"
                title={m.title}
              >
                {m.time} {m.title}
              </div>
            ))}
            {dayMeetings.length > 2 && (
              <div className="text-[8px] text-slate-400 text-center font-bold">
                +{dayMeetings.length - 2} more
              </div>
            )}
          </div>
          
          {/* Quick Plus button on hover */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleOpenAddModal(day);
            }}
            className="absolute bottom-1 right-1 p-0.5 bg-slate-100 hover:bg-blue-600 hover:text-white rounded text-slate-400 opacity-0 group-hover:opacity-100 sm:opacity-0 hover:opacity-100 transition duration-150"
            title="Schedule Meeting"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid - Left 2 Columns */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
        {/* Month Picker Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">
                {currentMonthName} {currentYear}
              </h2>
              <p className="text-xs text-slate-400">Manage client calls & review scheduled consultations</p>
            </div>
          </div>
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800">
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-3 text-slate-600 dark:text-slate-300 font-mono">July '26</span>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30" disabled>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of the Week headers */}
        <div className="grid grid-cols-7 text-center border-b border-slate-100 dark:border-slate-800 pb-2 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
            <span key={dayName} className="text-xs font-bold text-slate-400 font-sans py-1">
              {dayName}
            </span>
          ))}
        </div>

        {/* Calendar Day boxes */}
        <div className="grid grid-cols-7 flex-1 border-t border-l border-slate-100 dark:border-slate-800/80">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Sidebar - Right 1 Column: Daily schedule list details */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-md font-display font-bold text-slate-900 dark:text-white">
                Schedule • {selectedDay ? `July ${selectedDay}` : "Select a day"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedDay ? `${getMeetingsForDay(selectedDay).length} sessions scheduled` : ""}
              </p>
            </div>
            {selectedDay && (
              <button 
                onClick={() => handleOpenAddModal(selectedDay)}
                className="p-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
              >
                <Plus className="w-4 h-4" />
                Schedule
              </button>
            )}
          </div>

          {/* List of meetings scheduled for selected date */}
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {selectedDay === null ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                Select a calendar date to view slotted advisory meetings.
              </div>
            ) : getMeetingsForDay(selectedDay).length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No consultations slated for July {selectedDay}.
                <button 
                  onClick={() => handleOpenAddModal(selectedDay)}
                  className="text-xs text-blue-600 dark:text-blue-400 font-bold block mx-auto mt-2 hover:underline"
                >
                  Schedule one now
                </button>
              </div>
            ) : (
              getMeetingsForDay(selectedDay).map((meet) => (
                <div 
                  key={meet.id} 
                  className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 relative group"
                >
                  {/* Edit/Delete control hover icons */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenEditModal(meet)}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      title="Edit Session"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => onDeleteMeeting(meet.id)}
                      className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded text-rose-500"
                      title="Delete Session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 pr-10">{meet.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    {meet.clientName}
                  </p>

                  <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {meet.time} ({meet.duration} mins)
                    </span>
                    {meet.aiSuggested && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 rounded-md font-bold text-[8px]">
                        <Sparkles className="w-2.5 h-2.5" />
                        AI Sloted
                      </span>
                    )}
                  </div>

                  {meet.notes && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/50 text-[11px] text-slate-500 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                      {meet.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sync Indicator */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[10px] text-slate-400 font-sans">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Synced live with Local SQLite Cache & Gmail templates
        </div>

        {/* --- ADD MEETING FLOATING MODAL --- */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-100 dark:border-slate-800 shadow-2xl relative">
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                Schedule Consult • July {selectedDay}
              </h3>

              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Consultation Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Wayne Corp Portfolio Alignment" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Select Client</label>
                    <select 
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none"
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.name}>{c.name} ({c.company})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">AI Assigner</label>
                    <button
                      type="button"
                      onClick={handleAiMeetingSuggestion}
                      disabled={isAiGenerating}
                      className="w-full py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-semibold border border-blue-100 dark:border-blue-900 hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-bounce" />
                      {isAiGenerating ? "Thinking..." : "AI Suggest Topic"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Start Time</label>
                    <input 
                      type="time" 
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Duration (minutes)</label>
                    <input 
                      type="number" 
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                      required
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Brief Description / Agenda</label>
                  <textarea 
                    placeholder="Provide a quick advisory summary or agenda..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  Create Slotted Event
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- EDIT MEETING FLOATING MODAL --- */}
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
                Edit Slotted Meeting
              </h3>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Consultation Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Client Name</label>
                  <input 
                    type="text" 
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Start Time</label>
                    <input 
                      type="time" 
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Duration (mins)</label>
                    <input 
                      type="number" 
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                      required
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Agenda / Notes</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold"
                >
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
