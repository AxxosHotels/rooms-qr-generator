import { Readable } from "stream";

import { google } from "googleapis";

type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
};

const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive"];

export type DriveUploadResult =
  | {
      status: "uploaded";
      fileId: string;
      fileName: string;
      webViewLink: string | null;
    }
  | {
      status: "already_exists";
      fileId: string;
      fileName: string;
      webViewLink: string | null;
    };

function parseServiceAccountCredentials(): ServiceAccountCredentials {
  const rawCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!rawCredentials) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set.");
  }

  const credentials = JSON.parse(rawCredentials) as ServiceAccountCredentials;

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is missing required fields.");
  }

  return {
    ...credentials,
    private_key: credentials.private_key.replace(/\\n/g, "\n"),
  };
}

function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function getDriveClient() {
  const rawCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE;
  const canUseLocalKeyFile = process.env.NODE_ENV !== "production";

  if (rawCredentials) {
    const credentials = parseServiceAccountCredentials();
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: DRIVE_SCOPES,
    });

    return google.drive({ version: "v3", auth });
  }

  if (keyFile && canUseLocalKeyFile) {
    const auth = new google.auth.GoogleAuth({
      keyFile,
      scopes: DRIVE_SCOPES,
    });

    return google.drive({ version: "v3", auth });
  }

  if (keyFile && !canUseLocalKeyFile) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON is required in production. GOOGLE_SERVICE_ACCOUNT_KEY_FILE is only supported for local development.",
    );
  }

  throw new Error(
    "GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_KEY_FILE is required.",
  );
}

export async function uploadPdfToHotelFolder({
  fileName,
  folderId,
  pdfBytes,
}: {
  fileName: string;
  folderId: string;
  pdfBytes: Uint8Array;
}): Promise<DriveUploadResult> {
  const drive = getDriveClient();
  const escapedFileName = escapeDriveQueryValue(fileName);
  const escapedFolderId = escapeDriveQueryValue(folderId);
  const existingFiles = await drive.files.list({
    fields: "files(id,name,webViewLink)",
    pageSize: 1,
    q: [
      `name = '${escapedFileName}'`,
      `'${escapedFolderId}' in parents`,
      "trashed = false",
    ].join(" and "),
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  const existingFile = existingFiles.data.files?.[0];

  if (existingFile?.id) {
    return {
      status: "already_exists",
      fileId: existingFile.id,
      fileName,
      webViewLink: existingFile.webViewLink ?? null,
    };
  }

  const createdFile = await drive.files.create({
    fields: "id,name,webViewLink",
    media: {
      mimeType: "application/pdf",
      body: Readable.from(Buffer.from(pdfBytes)),
    },
    requestBody: {
      name: fileName,
      mimeType: "application/pdf",
      parents: [folderId],
    },
    supportsAllDrives: true,
  });

  if (!createdFile.data.id) {
    throw new Error("Google Drive did not return an uploaded file ID.");
  }

  return {
    status: "uploaded",
    fileId: createdFile.data.id,
    fileName,
    webViewLink: createdFile.data.webViewLink ?? null,
  };
}

export async function countPdfFilesInFolder(folderId: string): Promise<number> {
  const drive = getDriveClient();
  const escapedFolderId = escapeDriveQueryValue(folderId);
  let nextPageToken: string | undefined;
  let count = 0;

  do {
    const response = await drive.files.list({
      fields: "nextPageToken,files(id)",
      pageSize: 1000,
      pageToken: nextPageToken,
      q: [
        `'${escapedFolderId}' in parents`,
        "mimeType = 'application/pdf'",
        "trashed = false",
      ].join(" and "),
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    count += response.data.files?.length ?? 0;
    nextPageToken = response.data.nextPageToken ?? undefined;
  } while (nextPageToken);

  return count;
}
