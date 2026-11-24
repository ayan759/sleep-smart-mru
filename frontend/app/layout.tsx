import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Sleep Smart MRU",
    template: "%s | Sleep Smart MRU",
  },
  description:
    "Free sleep tools for Mount Royal University students: an alertness forecast, an exam study planner that protects sleep, and an anonymous campus poll.",
};

export const viewport: Viewport = {
  themeColor: "#27304f",
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
