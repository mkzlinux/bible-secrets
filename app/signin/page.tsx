import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { signInAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(next ?? "/account");

  return (
    <div className="relative isolate min-h-svh">
      <div className="absolute inset-0 -z-10">
        <Image src="/posters/poster-session.jpg" alt="" fill sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/92 to-ink-950/60" />
        <div className="grain absolute inset-0" />
      </div>

      <div className="mx-auto max-w-md px-5 pt-32 pb-20 md:px-0 md:pt-40">
        <h1 className="font-display text-3xl font-bold text-cream">Welcome back</h1>
        <p className="mt-3 font-serif text-[1.08rem] text-cream/75">
          Sign in to pick up where you stopped reading.
        </p>
        <div className="mt-7 rounded-2xl border border-cream/12 bg-ink-900/85 p-6 backdrop-blur md:p-8">
          <AuthForm mode="signin" action={signInAction} next={next ?? "/account"} />
        </div>
        <p className="mt-6 text-center text-[12.5px] text-cream-dim">
          No account yet?{" "}
          <Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-gold-400 underline decoration-gold-600/40">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
}
