import "server-only";

import { db } from "@/lib/db";

export async function listSavedRoutines(userId: string) {
  const saved = await db.savedRoutine.findMany({
    where: { userId, routine: { active: true } },
    orderBy: { createdAt: "desc" },
    select: { routine: { select: { slug: true, title: true, summary: true } } },
  });
  return saved.map((s) => s.routine);
}
