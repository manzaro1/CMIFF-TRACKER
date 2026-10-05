import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}

export const metadata: Metadata = {
  title: "CMIFF 2026 · Activity Tracker",
  description: "Cape Maclear International Film Festival — Live Operations Board",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
