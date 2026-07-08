import { NextResponse } from "next/server";
import { createServerSupabaseClient, getDefaultSiteSettings, getSiteSettings } from "@ielts-pro/shared";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSiteSettings(createServerSupabaseClient());
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(getDefaultSiteSettings());
  }
}
