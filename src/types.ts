export interface User {
  id: string;
  email: string;
  name: string;
  companyName: string;
  avatarUrl?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'Lead' | 'Active' | 'Inactive';
  interactionHistory: InteractionLog[];
}

export interface InteractionLog {
  id: string;
  date: string;
  type: 'Email' | 'Call' | 'Meeting' | 'Note';
  summary: string;
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Completed';
  dueDate: string;
  assignedContactId?: string;
}

export interface Meeting {
  id: string;
  title: string;
  clientName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // in minutes
  aiSuggested?: boolean;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  sources?: { title: string; url: string }[];
}

export interface EmailDraft {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  tone: string;
  intent: string;
  createdAt: string;
}

export interface SalesRecord {
  id: string;
  month: string;
  revenue: number;
  expenses: number;
  leadsGenerated: number;
}
