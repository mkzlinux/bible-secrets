import type { NextConfig } from "next";

/**
 * The Bereshit Lab engine runs as a separate process (Python/Flask on :8080).
 * The browser is never sent to it directly: every request goes through this
 * origin under `/engine`, so the workbench embeds cleanly in preview, in
 * production, and behind whatever proxy the deployment sits behind.
 */
const ENGINE_ORIGIN = (
  process.env.BERESHIT_URL ??
  process.env.BIBLE_SECRETS_ENGINE_URL ??
  process.env.NEXT_PUBLIC_BERESHIT_URL ??
  "http://127.0.0.1:8080"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  // `/engine/` must keep its trailing slash: the workbench resolves its own
  // assets relatively, so a redirect to `/engine` would break them.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: "/engine", destination: `${ENGINE_ORIGIN}/` },
      { source: "/engine/:path*", destination: `${ENGINE_ORIGIN}/:path*` },
    ];
  },
  // The app is served behind a preview proxy, so it must never be framed-blocked.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
          { key: "Referrer-Policy", value: "no-referrer-when-downgrade" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    // Large PDF uploads are proxied through route handlers.
    serverActions: { bodySizeLimit: "200mb" },
  },
};

export default nextConfig;
