import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import ServiceWorkerRegister from "./sw-register";
import InstallPrompt from "./install-prompt";
import OfflineBanner from "./offline-banner";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#7C3AED",
};

export const metadata: Metadata = {
  title: "Content Machine — AI Media System",
  description: "Одна идея → полноценная контент-система за секунды",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Content Machine",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <OfflineBanner />
        {children}
        <Analytics />
        <ServiceWorkerRegister />
        <InstallPrompt />
      </body>
    </html>
  );
}
