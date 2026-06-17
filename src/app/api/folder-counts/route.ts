import { NextResponse } from "next/server";

import { countPdfFilesInFolder } from "@/lib/googleDrive";
import { HOTELS } from "@/lib/hotels";

export const runtime = "nodejs";

export async function GET() {
  const counts = await Promise.all(
    HOTELS.map(async (hotel) => {
      try {
        return {
          slug: hotel.slug,
          count: await countPdfFilesInFolder(hotel.driveFolderId),
        };
      } catch (error) {
        if (error instanceof Error && error.stack) {
          console.error(error.stack);
        } else {
          console.error("Unknown Google Drive folder count error.");
        }

        return {
          slug: hotel.slug,
          count: null,
        };
      }
    }),
  );

  return NextResponse.json({ success: true, counts });
}
