import { NextRequest, NextResponse } from "next/server";
import { runParse } from "@/lib/run-parse";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "No file uploaded",
        chunks: null,
        demoMessage: null,
      },
      { status: 400 },
    );
  }

  const outcome = await runParse(request.headers, formData);
  return NextResponse.json(outcome.body, { status: outcome.status });
}
