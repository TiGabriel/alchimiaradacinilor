import { getCurrentSession } from "@/features/auth/session";
import { SubscriberStatus } from "@/generated/prisma/enums";
import { exportSubscribersCsv } from "@/services/admin/newsletter";
import { can } from "@/services/auth/permissions";

/** CSV export of subscribers (same filters as the list). Admins only. */
export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session || !can(session.user.roles, "users:manage"))
    return new Response("Not found", { status: 404 });
  const params = new URL(request.url).searchParams;
  const status = Object.values(SubscriberStatus).find((s) => s === params.get("status"));
  const csv = await exportSubscribersCsv(
    { id: session.user.id, roles: session.user.roles },
    {
      status,
      q: params.get("q")?.slice(0, 80) || undefined,
      source: params.get("source")?.slice(0, 40) || undefined,
      interest: params.get("interest")?.slice(0, 40) || undefined,
      customersOnly: params.get("customers") === "1",
    },
  );
  const day = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="abonati-newsletter-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
