import type { Metadata, Viewport } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/cinzel/400.css";
import "@fontsource/cinzel/600.css";
import "@fontsource/cinzel/700.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/frank-ruhl-libre/400.css";
import "@fontsource/frank-ruhl-libre/700.css";
import "./globals.css";

import { TopNav } from "@/components/TopNav";
import { MobileTabBar } from "@/components/MobileTabBar";
import { Footer } from "@/components/Footer";
import { getCurrentUser } from "@/lib/auth";
import { getLibrary } from "@/lib/library";

export const metadata: Metadata = {
  title: {
    default: "Bible Secrets — with Tinotenda Gwiriri",
    template: "%s · Bible Secrets",
  },
  description:
    "The cinematic teaching library of Tinotenda Gwiriri: series, volumes, comic issues and the Bereshit Lab Bible Technology engine. Built with Grieyx Studios.",
  applicationName: "Bible Secrets",
  openGraph: {
    title: "Bible Secrets — with Tinotenda Gwiriri",
    description:
      "Series, volumes, comics and the Bible Technology engine. Read in a cinematic reader, or join Tuesday night live on WhatsApp.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#050608",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, library] = [await getCurrentUser(), getLibrary()];

  return (
    <html lang="en">
      <body className="app-shell antialiased">
        <TopNav
          user={
            user
              ? { displayName: user.displayName, email: user.email, role: user.role }
              : null
          }
        />
        <main className="min-h-[70svh] pb-24 lg:pb-0">{children}</main>
        <MobileTabBar />
        <div className="lg:block">
          <Footer site={library.site} />
        </div>
      </body>
    </html>
  );
}
