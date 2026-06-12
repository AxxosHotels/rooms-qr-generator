import type { Hotel } from "@/lib/hotels";

export function buildQrPdfFileName(hotel: Pick<Hotel, "slug">, room: number) {
  return `${hotel.slug}_room-${room}_Tollar.pdf`;
}
