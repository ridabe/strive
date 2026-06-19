import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { students, financialPlans, attendance, workoutPlans } from "../../drizzle/schema";
import { eq, and, gte, lte, count, sql } from "drizzle-orm";

export const dashboardRouter = router({
  kpis: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { activeStudents: 0, weekWorkouts: 0, birthdaysThisMonth: 0, expiringPlans: 0 };

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const currentMonth = now.getMonth() + 1;

    // Alunos ativos
    const [activeResult] = await db
      .select({ count: count() })
      .from(students)
      .where(eq(students.status, "active"));

    // Treinos executados na semana (registros de frequência)
    const [weekResult] = await db
      .select({ count: count() })
      .from(attendance)
      .where(gte(attendance.attendedAt, weekAgo));

    // Aniversariantes do mês
    const [birthdayResult] = await db
      .select({ count: count() })
      .from(students)
      .where(
        and(
          eq(students.status, "active"),
          sql`MONTH(${students.birthDate}) = ${currentMonth}`
        )
      );

    // Planos vencendo em 7 dias
    const [expiringResult] = await db
      .select({ count: count() })
      .from(financialPlans)
      .where(
        and(
          eq(financialPlans.status, "pending"),
          gte(financialPlans.dueDate, sql`CURDATE()`),
          lte(financialPlans.dueDate, sql`DATE_ADD(CURDATE(), INTERVAL 7 DAY)`)
        )
      );

    return {
      activeStudents: activeResult?.count ?? 0,
      weekWorkouts: weekResult?.count ?? 0,
      birthdaysThisMonth: birthdayResult?.count ?? 0,
      expiringPlans: expiringResult?.count ?? 0,
    };
  }),

  expiringPlans: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const rows = await db
      .select({
        id: financialPlans.id,
        studentName: students.name,
        planName: financialPlans.planName,
        amount: financialPlans.amount,
        dueDate: financialPlans.dueDate,
        status: financialPlans.status,
      })
      .from(financialPlans)
      .innerJoin(students, eq(financialPlans.studentId, students.id))
      .where(
        and(
          eq(financialPlans.status, "pending"),
          lte(financialPlans.dueDate, sql`DATE_ADD(CURDATE(), INTERVAL 7 DAY)`)
        )
      )
      .orderBy(financialPlans.dueDate)
      .limit(10);

    return rows;
  }),

  birthdays: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const now = new Date();
    const currentMonth = now.getMonth() + 1;

    const rows = await db
      .select({
        id: students.id,
        name: students.name,
        birthDate: students.birthDate,
        phone: students.phone,
      })
      .from(students)
      .where(
        and(
          eq(students.status, "active"),
          sql`MONTH(${students.birthDate}) = ${currentMonth}`
        )
      )
      .orderBy(sql`DAY(${students.birthDate})`);

    return rows;
  }),

  recentActivity: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const rows = await db
      .select({
        id: attendance.id,
        studentName: students.name,
        attendedAt: attendance.attendedAt,
        workoutName: workoutPlans.name,
      })
      .from(attendance)
      .innerJoin(students, eq(attendance.studentId, students.id))
      .leftJoin(workoutPlans, eq(attendance.workoutPlanId, workoutPlans.id))
      .orderBy(sql`${attendance.attendedAt} DESC`)
      .limit(8);

    return rows;
  }),
});
