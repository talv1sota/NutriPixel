import { NextRequest, NextResponse } from "next/server";
import { parseRecipeFromUrl } from "@/lib/recipeParser";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }
    const parsed = await parseRecipeFromUrl(url);
    return NextResponse.json(parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Parse failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
