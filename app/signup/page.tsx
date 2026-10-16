import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { signUpAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";
import { getLibrary } from "@/lib/library";

export const metadata = { title: "Create your account" };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(next ?? "/account");
  const { site } = getLibrary();

  return (
    <div className="relative isolate min-h-svh">
      <div className="absolute inset-0 -z-10">
        <Image src="/posters/poster-session.jpg" alt="" fill sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/90 to-ink-950/50" />
        <div className="grain absolute inset-0" />
      </div>

      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 pt-28 pb-20 md:grid-cols-2 md:px-10 md:pt-36">
        <div>
          <p className="text-[10.5px] font-semibold tracking-[0.34em] text-gold-500 uppercase">
            Membership
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold text-cream md:text-[42px]">
            Three months of the whole vault. Free.
          </h1>
          <p className="mt-4 max-w-lg font-serif text-[1.12rem] leading-relaxed text-cream/80">
            Create an account and every locked volume opens — plus the{" "}
            {getLibrary().bibleTechnology.engine} Bible Technology engine. After{" "}
            {site.membership.trialDays} days, a small key fee keeps it open, and you can always
            support with a coffee instead.
          </p>
          <ul className="mt-6 space-y-2.5 text-[13px] text-cream-dim">
            {[
              "Every series, volume and comic issue",
              "Cinematic reader with bookmarks and resume",
              "PDF downloads while access is active",
              "Tuesday night session notes and Q&A archive",
              "Bible Technology engine (Hebrew + English)",
            ].map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-gold-500">✦</span>
                {line}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[12.5px] text-cream-dim/80">
            Already a member?{" "}
            <Link href={`/signin${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-gold-400 underline decoration-gold-600/40">
              Sign in
            </Link>
          </p>
        </div>

        <div className="rounded-2xl border border-cream/12 bg-ink-900/85 p-6 backdrop-blur md:p-8">
          <AuthForm mode="signup" action={signUpAction} next={next ?? "/account"} />
        </div>
      </div>
    </div>
  );
}
