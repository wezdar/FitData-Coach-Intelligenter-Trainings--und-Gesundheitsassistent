import type { Metadata } from "next";
import { headers } from "next/headers";
import { Barlow_Condensed, Inter } from "next/font/google";
import { LocaleProvider } from "@/components/locale-provider";
import "./globals.css";

const bodyFont = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const displayFont = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const socialImage = new URL("/og.png", origin).toString();

  return {
    metadataBase: new URL(origin),
    title: { default: "FitData Coach", template: "%s | FitData Coach" },
    description: "Intelligente Trainingsplanung und transparente Fitness-Analysen auf Basis nachvollziehbarer Daten.",
    applicationName: "FitData Coach",
    keywords: ["Fitness", "Training", "Datenanalyse", "Gesundheit", "ETL"],
    openGraph: {
      title: "FitData Coach – Training, das deine Daten versteht",
      description: "Personalisierte Trainingsplanung, Fortschrittsanalysen und transparente Datenqualität.",
      locale: "de_DE",
      type: "website",
      images: [{ url: socialImage, width: 1713, height: 910, alt: "FitData Coach mit Fortschrittsring und Aktivitätskurve" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "FitData Coach – Training, das deine Daten versteht",
      description: "Erklärbare Trainingsplanung und transparente Fitness-Analysen.",
      images: [socialImage],
    },
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" dir="ltr" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
