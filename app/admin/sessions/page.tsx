import Image from "next/image";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { SessionForm } from "@/components/admin/SessionForm";
import { deleteSessionAction } from "@/app/actions/admin";
import { isAdmin } from "@/lib/auth";
import { getSessions } from "@/lib/library";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Sessions · Publisher" };

export default async function AdminSessionsPage() {
  if (!(await isAdmin())) redirect("/signin?next=/admin/sessions");
  const sessions = getSessions();

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-16 md:px-10">
      <p className="text-[10.5px] font-semibold tracking-[0.34em] text-gold-500 uppercase">
        Publisher dashboard
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-cream md:text-4xl">
        Tuesday sessions
      </h1>
      <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-cream-dim">
        Post the next session poster, schedule details and the WhatsApp link. Every Tuesday at 8:00
        PM CAT, the live page and the home page spotlight follow whatever you publish here.
      </p>

      <div className="mt-6">
        <AdminNav active="/admin/sessions" />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <section className="rounded-2xl border border-gold-600/30 bg-ink-900/70 p-6">
          <h2 className="font-display text-lg font-bold text-cream">Post a session</h2>
          <p className="mt-1 mb-5 text-[12.5px] text-cream-dim">
            A poster image plus two lines of copy is all it takes.
          </p>
          <SessionForm />
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-lg font-bold text-cream">Published sessions</h2>
          {sessions.map((s) => (
            <article key={s.id} className="overflow-hidden rounded-xl border border-cream/10 bg-ink-900/60">
              <div className="relative aspect-video">
                <Image src={s.poster} alt="" fill sizes="380px" className="object-cover" />
              </div>
              <div className="p-4">
                <p className="text-[11px] text-gold-500">{formatDateTime(s.startsAt)}</p>
                <h3 className="mt-1 font-display text-[15px] font-bold text-cream">{s.title}</h3>
                <p className="mt-1 line-clamp-2 text-[12.5px] text-cream-dim">{s.description}</p>
                <form action={deleteSessionAction} className="mt-3">
                  <input type="hidden" name="id" value={s.id} />
                  <button className="text-[11.5px] text-coral-400 hover:underline">Delete</button>
                </form>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
