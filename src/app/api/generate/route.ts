import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";

import { buildQrPdfFileName } from "@/lib/fileNames";
import { uploadPdfToHotelFolder } from "@/lib/googleDrive";
import { getHotelBySlug } from "@/lib/hotels";
import { ParseRoomsError, parseRooms } from "@/lib/parseRooms";

export const runtime = "nodejs";

const QR_MARGIN = 10;
const QR_SIZE = 500;
const PDF_PAGE_SIZE = QR_SIZE + QR_MARGIN * 2;

type GenerateRequestBody = {
  hotelId?: unknown;
  locale?: unknown;
  rooms?: unknown;
};

type Locale = "cs" | "en" | "ru";

const ERROR_MESSAGES: Record<
  Locale,
  Record<
    | "invalidRequest"
    | "selectHotel"
    | "enterRoom"
    | "hotelNotFound"
    | "empty"
    | "invalid"
    | "positive"
    | "rangeFormat"
    | "rangeOrder"
    | "tooMany"
    | "processRooms"
    | "uploadFailed",
    string
  >
> = {
  cs: {
    invalidRequest: "Neplatný požadavek.",
    selectHotel: "Vyberte hotel.",
    enterRoom: "Zadejte číslo pokoje.",
    hotelNotFound: "Hotel nebyl nalezen.",
    empty: "Zadejte číslo pokoje.",
    invalid: "Zadejte číslo pokoje nebo rozsah pokojů.",
    positive: "Číslo pokoje musí být kladné číslo.",
    rangeFormat: "Zadejte jedno číslo pokoje nebo rozsah, například 101-105.",
    rangeOrder: "Začátek rozsahu nesmí být větší než konec.",
    tooMany: "V jednom požadavku lze vytvořit nejvýše 100 QR kódů.",
    processRooms: "Čísla pokojů se nepodařilo zpracovat.",
    uploadFailed: "Nahrání do Google Drive se nezdařilo.",
  },
  en: {
    invalidRequest: "Invalid request.",
    selectHotel: "Select a hotel.",
    enterRoom: "Enter a room number.",
    hotelNotFound: "Hotel was not found.",
    empty: "Enter a room number.",
    invalid: "Enter a room number or room range.",
    positive: "Room number must be a positive number.",
    rangeFormat: "Enter one room number or a range, for example 101-105.",
    rangeOrder: "The start of the range cannot be greater than the end.",
    tooMany: "You can create no more than 100 QR codes per request.",
    processRooms: "Room numbers could not be processed.",
    uploadFailed: "Google Drive upload failed.",
  },
  ru: {
    invalidRequest: "Некорректный запрос.",
    selectHotel: "Выберите отель.",
    enterRoom: "Введите номер комнаты.",
    hotelNotFound: "Отель не найден.",
    empty: "Введите номер комнаты.",
    invalid: "Введите номер комнаты или диапазон комнат.",
    positive: "Номер комнаты должен быть положительным числом.",
    rangeFormat: "Введите один номер комнаты или диапазон, например 101-105.",
    rangeOrder: "Начало диапазона не может быть больше конца.",
    tooMany: "Можно создать не больше 100 QR-кодов за один запрос.",
    processRooms: "Не удалось обработать номера комнат.",
    uploadFailed: "Не удалось загрузить файлы в Google Drive.",
  },
};

function getLocale(locale: unknown): Locale {
  return locale === "en" || locale === "ru" ? locale : "cs";
}

function getErrorMessage(locale: Locale, key: keyof (typeof ERROR_MESSAGES)["cs"]) {
  return ERROR_MESSAGES[locale][key];
}

function getGoogleApiStatusCode(error: unknown): number | string | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const maybeGoogleError = error as {
    code?: unknown;
    status?: unknown;
    response?: {
      status?: unknown;
      data?: {
        error?: {
          code?: unknown;
        };
      };
    };
  };

  const status =
    maybeGoogleError.response?.status ??
    maybeGoogleError.response?.data?.error?.code ??
    maybeGoogleError.status;

  return typeof status === "number" || typeof status === "string"
    ? status
    : null;
}

function getErrorDetails(error: unknown) {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "Unknown Google Drive error.";
  const statusCode = getGoogleApiStatusCode(error);

  return { message, statusCode };
}

function buildUploadErrorMessage(locale: Locale, error: unknown) {
  const { message, statusCode } = getErrorDetails(error);
  const prefix = getErrorMessage(locale, "uploadFailed").replace(/\.$/, "");
  const details = [`${prefix}:`, message];

  if (statusCode) {
    details.push(`Status code: ${statusCode}`);
  }

  return details.join("\n");
}

async function createRoomQrPdf(url: string) {
  const qrPng = await QRCode.toBuffer(url, {
    errorCorrectionLevel: "M",
    margin: 0,
    type: "png",
    width: QR_SIZE,
  });

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PDF_PAGE_SIZE, PDF_PAGE_SIZE]);
  const qrImage = await pdf.embedPng(qrPng);

  page.drawImage(qrImage, {
    x: QR_MARGIN,
    y: QR_MARGIN,
    width: QR_SIZE,
    height: QR_SIZE,
  });

  const pdfBytes = await pdf.save();

  return pdfBytes;
}

export async function POST(request: Request) {
  let body: GenerateRequestBody;

  try {
    body = (await request.json()) as GenerateRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, error: getErrorMessage("cs", "invalidRequest") },
      { status: 400 },
    );
  }

  const locale = getLocale(body.locale);

  if (typeof body.hotelId !== "string") {
    return NextResponse.json(
      { success: false, error: getErrorMessage(locale, "selectHotel") },
      { status: 400 },
    );
  }

  if (typeof body.rooms !== "string") {
    return NextResponse.json(
      { success: false, error: getErrorMessage(locale, "enterRoom") },
      { status: 400 },
    );
  }

  const selectedHotel = getHotelBySlug(body.hotelId);

  if (!selectedHotel) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(locale, "hotelNotFound") },
      { status: 404 },
    );
  }

  let rooms: number[];

  try {
    rooms = parseRooms(body.rooms);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof ParseRoomsError
            ? getErrorMessage(locale, error.code)
            : getErrorMessage(locale, "processRooms"),
      },
      { status: 400 },
    );
  }

  try {
    const results = await Promise.all(
      rooms.map(async (room) => {
        const url = `${selectedHotel.baseUrl}?room=${room}`;
        const fileName = buildQrPdfFileName(selectedHotel, room);
        const pdfBytes = await createRoomQrPdf(url);
        const uploadResult = await uploadPdfToHotelFolder({
          fileName,
          folderId: selectedHotel.driveFolderId,
          pdfBytes,
        });

        return {
          room,
          fileName,
          fileId: uploadResult.fileId,
          status: uploadResult.status,
          url,
          webViewLink: uploadResult.webViewLink,
        };
      }),
    );
    const created = results.filter((file) => file.status === "uploaded");
    const skipped = results.filter((file) => file.status === "already_exists");

    return NextResponse.json({
      success: true,
      created,
      skipped,
      folderUrl: selectedHotel.folderUrl,
    });
  } catch (error) {
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    } else {
      console.error("Unknown Google Drive upload error.");
    }

    return NextResponse.json(
      {
        success: false,
        error: buildUploadErrorMessage(locale, error),
      },
      { status: 500 },
    );
  }
}
