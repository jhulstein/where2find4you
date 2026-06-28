import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.where2find4you.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "where2find4you",
  description:
    "AI-powered local discovery for people looking for places, services and experiences.",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  applicationName: "where2find4you",
  appleWebApp: {
    capable: true,
    title: "where2find4you",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <div className="min-h-screen">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
