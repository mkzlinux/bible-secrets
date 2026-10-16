import { NextResponse } from "next/server";
import { z } from "zod";
import { saveProgress } from "@/lib/store";
import { getCurrentUser, userKey } from "@/lib/auth";

const schema = z.object({
  partSlug: z.string().min(1),
  page: z.number().int().min(0),
  pageCount: z.number().int().min(0),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const user = await getCurrentUser();
  saveProgress({
    userKey: userKey(user),
    partSlug: parsed.data.partSlug,
    page: parsed.data.page,
    pageCount: parsed.data.pageCount,
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}
