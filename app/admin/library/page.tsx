import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { PartForm } from "@/components/admin/PartForm";
import { deletePartAction } from "@/app/actions/admin";
import { isAdmin } from "@/lib/auth";
import { getLibrary } from "@/lib/library";

export const metadata = { title: "Library · Publisher" };

export default async function AdminLibraryPage() {
  if (!(await isAdmin())) redirect("/signin?next=/admin/library");
  const library = getLibrary();

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-16 md:px-10">
      <p className="text-[10.5px] font-semibold tracking-[0.34em] text-gold-500 uppercase">
        Publisher dashboard
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-cream md:text-4xl">Library</h1>
      <div className="mt-6">
        <AdminNav active="/admin/library" />
      </div>

      <section className="mt-8 rounded-2xl border border-gold-600/30 bg-ink-900/70 p-6">
        <h2 className="font-display text-lg font-bold text-cream">Add a volume</h2>
        <p className="mt-1 mb-5 text-[12.5px] text-cream-dim">
          Paste a Drive file id, or upload the PDF and poster directly. Uploads land in Supabase
          Storage when the keys are configured, otherwise in <code>/public/uploads</code>.
        </p>
        <PartForm series={library.series} />
      </section>

      <div className="mt-10 space-y-10">
        {library.series.map((series) => (
          <section key={series.slug}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-xl font-bold text-cream">{series.title}</h2>
              <p className="text-[12px] text-cream-dim">
                {series.parts.length} volumes ·{" "}
                {series.parts.filter((p) => p.access === "public").length} open
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {series.parts.map((part) => (
                <details key={part.slug} className="rounded-xl border border-cream/10 bg-ink-900/50">
                  <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3">
                    <span className="font-display text-[13px] text-gold-500">
                      #{String(part.number).padStart(2, "0")}
                    </span>
                    <span className="flex-1 truncate text-[13.5px] text-cream">{part.title}</span>
                    <span
                      className={
                        part.access === "public"
                          ? "chip border-teal-400/40 text-teal-400"
                          : "chip border-coral-400/40 text-coral-400"
                      }
                    >
                      {part.access === "public" ? "Open" : "Vault"}
                    </span>
                    <span className="hidden font-mono text-[10.5px] text-cream-dim/70 md:inline">
                      {part.driveId ?? part.streamUrl ?? "no source"}
                    </span>
                  </summary>

                  <div className="border-t border-cream/10 px-4 py-5">
                    <PartForm series={library.series} part={part} />
                    <form action={deletePartAction} className="mt-4 border-t border-cream/10 pt-4">
                      <input type="hidden" name="slug" value={part.slug} />
                      <button className="text-[12px] text-coral-400 hover:underline">
                        Remove “{part.title}” from the library
                      </button>
                    </form>
                  </div>
                </details>
              ))}
              {series.parts.length === 0 && (
                <p className="text-[13px] text-cream-dim">No volumes in this series yet.</p>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
