import { NextResponse } from "next/server";
import { searchLibrary } from "@/lib/library";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const hits = searchLibrary(q).map(({ series, part }) => ({
    partSlug: part.slug,
    title: part.title,
    seriesTitle: series.title,
    seriesSlug: series.slug,
    poster: part.poster || series.poster,
    access: part.access,
  }));
  return NextResponse.json({ hits });
}
