import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { isAdmin } from "@/lib/auth";
import { getLibrary, getSessions, publicCount } from "@/lib/library";
import { snapshot } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Publisher dashboard" };

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/signin?next=/admin");

  const library = getLibrary();
  const counts = publicCount();
  const store = snapshot();
  const sessions = getSessions();

  const stats = [
    { label: "Series", value: library.series.length },
    { label: "Volumes", value: counts.total },
    { label: "Open to all", value: counts.public },
    { label: "In the vault", value: counts.total - counts.public },
    { label: "Members", value: store.users.length },
    { label: "Payments", value: store.payments.length },
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-16 md:px-10">
      <p className="text-[10.5px] font-semibold tracking-[0.34em] text-gold-500 uppercase">
        Publisher dashboard
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-cream md:text-4xl">
        Manage Bible Secrets
      </h1>
      <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-cream-dim">
        Upload volumes and artwork, set what belongs to the open 40% or the vault, publish the
        Tuesday session poster, and keep an eye on members and payments.
      </p>

      <div className="mt-6">
        <AdminNav active="/admin" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-cream/10 bg-ink-900/60 p-4">
            <p className="text-[10px] font-semibold tracking-[0.22em] text-cream-dim uppercase">
              {s.label}
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-cream">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-cream/10 bg-ink-900/60 p-6">
          <h2 className="font-display text-lg font-bold text-cream">Next live session</h2>
          <p className="mt-2 text-[13.5px] text-cream-dim">
            {sessions[0]?.title} · {formatDateTime(sessions[0]?.startsAt)}
          </p>
          <div className="mt-4 flex gap-2">
            <Link href="/admin/sessions" className="btn btn-gold text-sm">
              Post a session poster
            </Link>
            <Link href="/live" className="btn btn-ghost text-sm">
              View live page
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-cream/10 bg-ink-900/60 p-6">
          <h2 className="font-display text-lg font-bold text-cream">Publishing checklist</h2>
          <ul className="mt-3 space-y-2 text-[13px] text-cream-dim">
            <li>1 · Drop the edited PDF into the Drive folder (or upload it here).</li>
            <li>2 · Add the volume to its series, set public or vault.</li>
            <li>3 · Attach the poster art so the hero animates with it.</li>
            <li>4 · Post the Tuesday poster and WhatsApp link.</li>
            <li>5 · Publish — the home hero and series page update immediately.</li>
          </ul>
          <div className="mt-4 flex gap-2">
            <Link href="/admin/library" className="btn btn-gold text-sm">
              Manage library
            </Link>
            <Link href="/admin/users" className="btn btn-ghost text-sm">
              Members & access
            </Link>
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-cream/10 bg-ink-900/60 p-6">
        <h2 className="font-display text-lg font-bold text-cream">Series at a glance</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead className="text-[10.5px] tracking-[0.2em] text-cream-dim uppercase">
              <tr>
                <th className="pb-2">Series</th>
                <th className="pb-2">Volumes</th>
                <th className="pb-2">Open</th>
                <th className="pb-2">Vault</th>
                <th className="pb-2">Badge</th>
              </tr>
            </thead>
            <tbody>
              {library.series.map((s) => {
                const open = s.parts.filter((p) => p.access === "public").length;
                return (
                  <tr key={s.slug} className="border-t border-cream/8">
                    <td className="py-2.5 pr-4 text-cream">{s.title}</td>
                    <td className="py-2.5 pr-4 text-cream-dim">{s.parts.length}</td>
                    <td className="py-2.5 pr-4 text-teal-400">{open}</td>
                    <td className="py-2.5 pr-4 text-coral-400">{s.parts.length - open}</td>
                    <td className="py-2.5 pr-4 text-cream-dim">{s.badge}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
