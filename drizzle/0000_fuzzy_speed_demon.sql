CREATE TYPE "public"."financial_plan_status" AS ENUM('pending', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."student_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."workout_plan_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"studentId" integer NOT NULL,
	"workoutPlanId" integer,
	"attendedAt" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"studentId" integer NOT NULL,
	"planName" varchar(100) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"dueDate" date NOT NULL,
	"paidAt" timestamp,
	"status" "financial_plan_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "physical_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"studentId" integer NOT NULL,
	"assessedAt" date NOT NULL,
	"weight" numeric(5, 2),
	"height" numeric(5, 2),
	"bodyFat" numeric(5, 2),
	"chest" numeric(5, 2),
	"waist" numeric(5, 2),
	"hip" numeric(5, 2),
	"thigh" numeric(5, 2),
	"arm" numeric(5, 2),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(320),
	"phone" varchar(30),
	"birthDate" date,
	"goal" varchar(255),
	"status" "student_status" DEFAULT 'active' NOT NULL,
	"avatarUrl" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"supabaseId" varchar(36) NOT NULL,
	"name" text,
	"email" varchar(320),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_supabaseId_unique" UNIQUE("supabaseId")
);
--> statement-breakpoint
CREATE TABLE "workout_exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"workoutPlanId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"sets" integer,
	"reps" varchar(50),
	"load" varchar(50),
	"restSeconds" integer,
	"notes" text,
	"order" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"studentId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" "workout_plan_status" DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_studentId_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_workoutPlanId_workout_plans_id_fk" FOREIGN KEY ("workoutPlanId") REFERENCES "public"."workout_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_plans" ADD CONSTRAINT "financial_plans_studentId_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "physical_assessments" ADD CONSTRAINT "physical_assessments_studentId_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_workoutPlanId_workout_plans_id_fk" FOREIGN KEY ("workoutPlanId") REFERENCES "public"."workout_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_studentId_students_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;
