import { readFile } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GENERATED_DIR = path.join(process.cwd(), "public", "generated");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileName: string }> },
) {
  const { fileName } = await params;

  if (!/^[a-z0-9-]+_room-\d+_Tollar\.pdf$/.test(fileName)) {
    return NextResponse.json({ error: "Invalid file name." }, { status: 400 });
  }

  try {
    const file = await readFile(path.join(GENERATED_DIR, fileName));

    return new NextResponse(file, {
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
