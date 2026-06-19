import {
  serial,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  date,
  numeric,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const studentStatusEnum = pgEnum("student_status", ["active", "inactive"]);
export const financialPlanStatusEnum = pgEnum("financial_plan_status", ["pending", "paid", "overdue", "cancelled"]);
export const workoutPlanStatusEnum = pgEnum("workout_plan_status", ["active", "inactive"]);

// ─── Users (auth via Supabase) ───────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  supabaseId: varchar("supabaseId", { length: 36 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Students ────────────────────────────────────────────────────────────────
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  birthDate: date("birthDate"),
  goal: varchar("goal", { length: 255 }),
  status: studentStatusEnum("status").default("active").notNull(),
  avatarUrl: text("avatarUrl"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

// ─── Financial Plans ─────────────────────────────────────────────────────────
export const financialPlans = pgTable("financial_plans", {
  id: serial("id").primaryKey(),
  studentId: integer("studentId").notNull().references(() => students.id),
  planName: varchar("planName", { length: 100 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("dueDate").notNull(),
  paidAt: timestamp("paidAt"),
  status: financialPlanStatusEnum("status").default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type FinancialPlan = typeof financialPlans.$inferSelect;
export type InsertFinancialPlan = typeof financialPlans.$inferInsert;

// ─── Workout Plans ───────────────────────────────────────────────────────────
export const workoutPlans = pgTable("workout_plans", {
  id: serial("id").primaryKey(),
  studentId: integer("studentId").notNull().references(() => students.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: workoutPlanStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type WorkoutPlan = typeof workoutPlans.$inferSelect;

// ─── Workout Exercises ───────────────────────────────────────────────────────
export const workoutExercises = pgTable("workout_exercises", {
  id: serial("id").primaryKey(),
  workoutPlanId: integer("workoutPlanId").notNull().references(() => workoutPlans.id),
  name: varchar("name", { length: 255 }).notNull(),
  sets: integer("sets"),
  reps: varchar("reps", { length: 50 }),
  load: varchar("load", { length: 50 }),
  restSeconds: integer("restSeconds"),
  notes: text("notes"),
  order: integer("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("studentId").notNull().references(() => students.id),
  workoutPlanId: integer("workoutPlanId").references(() => workoutPlans.id),
  attendedAt: timestamp("attendedAt").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Attendance = typeof attendance.$inferSelect;

// ─── Physical Assessments ─────────────────────────────────────────────────────
export const physicalAssessments = pgTable("physical_assessments", {
  id: serial("id").primaryKey(),
  studentId: integer("studentId").notNull().references(() => students.id),
  assessedAt: date("assessedAt").notNull(),
  weight: numeric("weight", { precision: 5, scale: 2 }),
  height: numeric("height", { precision: 5, scale: 2 }),
  bodyFat: numeric("bodyFat", { precision: 5, scale: 2 }),
  chest: numeric("chest", { precision: 5, scale: 2 }),
  waist: numeric("waist", { precision: 5, scale: 2 }),
  hip: numeric("hip", { precision: 5, scale: 2 }),
  thigh: numeric("thigh", { precision: 5, scale: 2 }),
  arm: numeric("arm", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
