import { getAdminStats } from "@/services/admin/stats";

export default async function AdminHomePage() {
  const stats = await getAdminStats();
  const tiles = [
    { label: "Produse active", value: `${stats.activeProducts} / ${stats.products}` },
    { label: "Conturi", value: `${stats.users}` },
    { label: "Conturi confirmate", value: `${stats.verifiedUsers}` },
    { label: "Abonați newsletter", value: `${stats.subscribers}` },
    { label: "Comenzi", value: `${stats.orders}` },
  ];
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-eyebrow text-clay">Panou de administrare</p>
        <h1 className="text-display-lg">Bine ai venit</h1>
        <p className="max-w-2xl text-ink-muted">
          Instrumentele de administrare (catalog, conținut, comenzi, setări) sunt construite într-o
          fază ulterioară. Deocamdată, această pagină confirmă accesul și afișează câteva cifre.
        </p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((t) => (
          <li
            key={t.label}
            className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-5"
          >
            <span className="text-sm text-ink-muted">{t.label}</span>
            <span className="font-display text-3xl">{t.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
