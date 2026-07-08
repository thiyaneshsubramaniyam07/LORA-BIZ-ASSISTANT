import { integer, pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  password: text('password'),
  name: text('name').notNull(),
  companyName: text('company_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Customers table
export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  company: text('company'),
  status: text('status').notNull(), // Active, Lead, etc.
  interactionHistory: jsonb('interaction_history').default([]),
  createdAt: timestamp('created_at').defaultNow(),
});

// Meetings table
export const meetings = pgTable('meetings', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  clientName: text('client_name').notNull(),
  date: text('date').notNull(),
  time: text('time').notNull(),
  duration: integer('duration').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tasks table
export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  priority: text('priority').notNull(),
  status: text('status').notNull(),
  dueDate: text('due_date').notNull(),
  assignedContactId: text('assigned_contact_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Sales table
export const sales = pgTable('sales', {
  id: text('id').primaryKey(),
  month: text('month').notNull(),
  revenue: integer('revenue').notNull(),
  expenses: integer('expenses').notNull(),
  leadsGenerated: integer('leads_generated').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
