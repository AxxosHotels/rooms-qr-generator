"use client";

import { FormEvent, useState } from "react";

import { HOTELS } from "@/lib/hotels";

type Locale = "cs" | "en" | "ru";

type GenerateSuccess = {
  success: true;
  created: Array<{
    fileId: string;
    room: number;
    fileName: string;
    status: "uploaded";
    url: string;
    webViewLink: string | null;
  }>;
  skipped: Array<{
    fileId: string;
    room: number;
    fileName: string;
    status: "already_exists";
    url: string;
    webViewLink: string | null;
  }>;
  folderUrl: string;
};

type GenerateError = {
  success: false;
  error: string;
};

type GenerateResponse = GenerateSuccess | GenerateError;

const COPY: Record<
  Locale,
  {
    appLabel: string;
    title: string;
    warning: string;
    foldersLabel: string;
    generatorTitle: string;
    hotelLabel: string;
    roomLabel: string;
    roomPlaceholder: string;
    generate: string;
    generating: string;
    ready: string;
    createdCount: (count: number) => string;
    skippedCount: (count: number) => string;
    openFolder: string;
    uploadedFiles: string;
    skippedFiles: string;
    requestFailed: string;
  }
> = {
  cs: {
    appLabel: "Tollar Hotels",
    title: "QR Tollar kódy pro hotelové pokoje",
    warning:
      "Než vygenerujete nový kód, zkontrolujte, zda už takový kód neexistuje.",
    foldersLabel: "Složky hotelů na Google Drive",
    generatorTitle: "Vygenerovat nový QR kód",
    hotelLabel: "Hotel",
    roomLabel: "Pokoj nebo rozsah",
    roomPlaceholder: "105 nebo 101-105",
    generate: "Vygenerovat",
    generating: "Generuji...",
    ready: "QR kódy jsou připravené",
    createdCount: (count) => `Nahrané soubory: ${count}`,
    skippedCount: (count) => `Přeskočené soubory: ${count}`,
    openFolder: "Otevřít složku hotelu",
    uploadedFiles: "Nahrané soubory",
    skippedFiles: "Již existují",
    requestFailed: "Požadavek se nepodařilo odeslat. Zkuste to znovu.",
  },
  en: {
    appLabel: "Tollar Hotels",
    title: "QR Tollar codes for hotel rooms",
    warning:
      "Before generating a new code, check whether this code already exists.",
    foldersLabel: "Hotel Google Drive folders",
    generatorTitle: "Generate a new QR code",
    hotelLabel: "Hotel",
    roomLabel: "Room or range",
    roomPlaceholder: "105 or 101-105",
    generate: "Generate",
    generating: "Generating...",
    ready: "QR codes are ready",
    createdCount: (count) => `Uploaded files: ${count}`,
    skippedCount: (count) => `Skipped files: ${count}`,
    openFolder: "Open hotel folder",
    uploadedFiles: "Uploaded files",
    skippedFiles: "Already exists",
    requestFailed: "The request could not be sent. Try again.",
  },
  ru: {
    appLabel: "Tollar Hotels",
    title: "QR Tollar коды для номеров в отелях",
    warning:
      "Прежде чем генерировать новый код, посмотрите, возможно такой код уже есть.",
    foldersLabel: "Папки отелей в Google Drive",
    generatorTitle: "Сгенерировать новый QR код",
    hotelLabel: "Отель",
    roomLabel: "Номер или диапазон",
    roomPlaceholder: "105 или 101-105",
    generate: "Сгенерировать",
    generating: "Генерация...",
    ready: "QR-коды готовы",
    createdCount: (count) => `Загружено файлов: ${count}`,
    skippedCount: (count) => `Пропущено файлов: ${count}`,
    openFolder: "Открыть папку отеля",
    uploadedFiles: "Загруженные файлы",
    skippedFiles: "Уже существуют",
    requestFailed: "Не удалось отправить запрос. Попробуйте еще раз.",
  },
};

const LANGUAGE_OPTIONS: Array<{ locale: Locale; label: string }> = [
  { locale: "cs", label: "CZ" },
  { locale: "en", label: "EN" },
  { locale: "ru", label: "RU" },
];

export default function Home() {
  const [locale, setLocale] = useState<Locale>("cs");
  const [hotelId, setHotelId] = useState(HOTELS[0]?.slug ?? "");
  const [rooms, setRooms] = useState("");
  const [result, setResult] = useState<GenerateSuccess | null>(null);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const copy = COPY[locale];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setError("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hotelId, rooms, locale }),
      });
      const data = (await response.json()) as GenerateResponse;

      if (!data.success) {
        setError(data.error);
        return;
      }

      setResult(data);
    } catch {
      setError(copy.requestFailed);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="workspace">
        <header className="page-header">
          <div>
            <p className="eyebrow">{copy.appLabel}</p>
            <h1>{copy.title}</h1>
          </div>

          <div className="language-switcher" aria-label="Language">
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                aria-pressed={locale === option.locale}
                className="language-switcher__button"
                key={option.locale}
                onClick={() => {
                  setLocale(option.locale);
                  setError("");
                }}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>

        <p className="notice">{copy.warning}</p>

        <div className="drive-links" aria-label={copy.foldersLabel}>
          {HOTELS.map((hotel) => (
            <a
              className="drive-link"
              href={hotel.folderUrl}
              key={hotel.slug}
              rel="noreferrer"
              target="_blank"
            >
              {hotel.name}
            </a>
          ))}
        </div>

        <section className="generator-card">
          <h2>{copy.generatorTitle}</h2>

          <form className="form" onSubmit={handleSubmit}>
            <label className="field">
              <span>{copy.hotelLabel}</span>
              <select
                value={hotelId}
                onChange={(event) => setHotelId(event.target.value)}
              >
                {HOTELS.map((hotel) => (
                  <option key={hotel.slug} value={hotel.slug}>
                    {hotel.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>{copy.roomLabel}</span>
              <input
                inputMode="numeric"
                onChange={(event) => setRooms(event.target.value)}
                placeholder={copy.roomPlaceholder}
                value={rooms}
              />
            </label>

            <button className="primary-button" disabled={isGenerating}>
              {isGenerating ? copy.generating : copy.generate}
            </button>
          </form>

          {error ? <p className="error">{error}</p> : null}

          {result ? (
            <section className="result" aria-live="polite">
              <div className="result__summary">
                <div>
                  <h3>{copy.ready}</h3>
                  <p>{copy.createdCount(result.created.length)}</p>
                  <p>{copy.skippedCount(result.skipped.length)}</p>
                </div>
                <a
                  className="primary-button"
                  href={result.folderUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {copy.openFolder}
                </a>
              </div>

              {result.created.length > 0 ? (
                <div className="file-group">
                  <h4>{copy.uploadedFiles}</h4>
                  <ul className="file-list">
                    {result.created.map((file) => (
                      <li className="file-list__item" key={file.fileName}>
                        <span>{file.fileName}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {result.skipped.length > 0 ? (
                <div className="file-group">
                  <h4>{copy.skippedFiles}</h4>
                  <ul className="file-list">
                    {result.skipped.map((file) => (
                      <li className="file-list__item" key={file.fileName}>
                        <span>{file.fileName}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}
        </section>
      </section>
    </main>
  );
}
