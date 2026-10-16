import Image from "next/image";
import Link from "next/link";
import { SessionSpotlight } from "@/components/SessionSpotlight";
import { Rail } from "@/components/Rail";
import { getLibrary, getSessions } from "@/lib/library";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Tuesday Night Live" };

export default function LivePage() {
  const library = getLibrary();
  const sessions = getSessions();
  const qa = library.series.find((s) => s.slug === "question-and-answer");
  const session = sessions[0];

  return (
    <div className="pt-20">
      <SessionSpotlight
        title={session?.title ?? library.liveSession.title}
        description={session?.description ?? ""}
        poster={session?.poster ?? library.liveSession.poster}
        startsAt={session?.startsAt ?? new Date().toISOString()}
        whatsappUrl={session?.whatsappUrl ?? ""}
        host={library.site.founder}
      />

      <section className="mx-auto max-w-[1400px] px-5 pb-6 md:px-10">
        <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div>
            <h2 className="font-display text-xl font-bold text-cream md:text-2xl">
              How Tuesday night works
            </h2>
            <ol className="mt-4 space-y-4">
              {[
                {
                  title: "8:00 PM CAT — the session opens on WhatsApp",
                  body: "The poster for the night is posted here and in the group. Tinotenda opens the Word, verse by verse, and the teaching runs live.",
                },
                {
                  title: "Questions are taken as they come",
                  body: "Send your question in the group. If it needs more room than the session allows, it is carried to the Q&A archive and answered with the text open.",
                },
                {
                  title: "Wednesday — the editing table",
                  body: "The session is transcribed, edited and laid out with the artwork, then published here as a volume. Members can read it in the cinematic reader and download the PDF.",
                },
                {
                  title: "The archive grows",
                  body: "Everything lands in the library by series: Melchizedek, the Days of Noah, the Q&A archive, and the illustrated comic issues.",
                },
              ].map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold-600/40 font-display text-[13px] font-bold text-gold-400">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-[14px] font-semibold text-cream">{step.title}</span>
                    <span className="mt-1 block font-serif text-[1.02rem] leading-relaxed text-cream/75">
                      {step.body}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <aside className="space-y-5">
            <div className="overflow-hidden rounded-xl border border-cream/10 bg-ink-900/60">
              <div className="relative aspect-[2/3] max-h-[380px]">
                <Image
                  src={session?.poster ?? library.liveSession.poster}
                  alt=""
                  fill
                  sizes="320px"
                  className="object-cover object-top"
                />
              </div>
              <div className="p-5">
                <p className="text-[10.5px] font-semibold tracking-[0.3em] text-coral-400 uppercase">
                  Next session poster
                </p>
                <p className="mt-2 font-display text-base font-bold text-cream">
                  {session?.title ?? library.liveSession.title}
                </p>
                <p className="mt-1 text-[12.5px] text-cream-dim">
                  {formatDateTime(session?.startsAt)} · {library.site.session.channel}
                </p>
                <p className="mt-3 text-[12px] leading-relaxed text-cream-dim/80">
                  Posters and notes are published by the team from the publisher dashboard.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gold-600/25 bg-ink-900/60 p-5">
              <p className="text-[10.5px] font-semibold tracking-[0.3em] text-gold-500 uppercase">
                Never miss one
              </p>
              <p className="mt-2 font-serif text-[1.02rem] text-cream/80">
                Create an account and the session notes, archives and vault volumes come with it.
              </p>
              <Link href="/signup" className="btn btn-gold mt-4 w-full text-sm">
                Create free account
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {sessions.length > 1 && (
        <Section title="Recent sessions">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.slice(1).map((s) => (
              <article key={s.id} className="rounded-xl border border-cream/10 bg-ink-900/50 p-5">
                <p className="text-[11px] text-gold-500">{formatDateTime(s.startsAt)}</p>
                <h3 className="mt-2 font-display text-base font-bold text-cream">{s.title}</h3>
                <p className="mt-2 font-serif text-[1rem] leading-relaxed text-cream/70">
                  {s.description}
                </p>
              </article>
            ))}
          </div>
        </Section>
      )}

      {qa && (
        <Rail
          eyebrow="From the Tuesday nights"
          title="Question & Answer archive"
          href={`/series/${qa.slug}`}
          items={qa.parts.map((p) => ({
            slug: p.slug,
            title: p.title,
            poster: qa.poster,
            seriesTitle: "Q&A archive",
            access: p.access,
            meta: `Volume ${p.number}`,
          }))}
        />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-[1400px] px-5 py-8 md:px-10">
      <h2 className="font-display text-xl font-bold text-cream md:text-2xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
