import { NextResponse } from "next/server";
import { createServerSupabaseClient, getPublishedTaskByIdForStudent } from "@ielts-pro/shared";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const taskId = url.searchParams.get("taskId");
        const supabase = createServerSupabaseClient();

        let taskResult = null;
        let taskError = null;

        if (taskId) {
            try {
                taskResult = await getPublishedTaskByIdForStudent(supabase, taskId);
            } catch (err: any) {
                taskError = { message: err.message, stack: err.stack };
            }
        }

        return NextResponse.json({ taskResult, taskError });
    } catch (err: any) {
        return NextResponse.json({ error: err.message, stack: err.stack });
    }
}
