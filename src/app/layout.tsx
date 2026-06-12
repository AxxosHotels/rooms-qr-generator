import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Tollar QR Generator",
  description: "Hotel room QR code generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
