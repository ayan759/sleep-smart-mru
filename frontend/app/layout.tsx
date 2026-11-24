import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Free sleep tools for Mount Royal University students: an alertness forecast, an exam study planner that protects sleep, an anonymous campus poll and a sleep guide.";

export const metadata: Metadata = {
  metadataBase: new URL("https://sleep-smart-mru.vercel.app"),
  title: {
    default: "Sleep Smart MRU",
    template: "%s | Sleep Smart MRU",
  },
  description: DESCRIPTION,
  applicationName: "Sleep Smart MRU",
  openGraph: {
    type: "website",
    siteName: "Sleep Smart MRU",
    title: "Sleep Smart MRU",
    description: DESCRIPTION,
    locale: "en_CA",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e1c", // --color-abyss, the page background
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-CA" className={`${inter.variable} h-full antialiased`}>
      <body className="relative isolate flex min-h-full flex-col overflow-x-clip font-sans">
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
