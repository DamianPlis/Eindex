import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import PwaRegistrar from "@/components/pwa/PwaRegistrar";
import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const displayFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eindx",
  description: "Server-first Next.js school planning app",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Eindx",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2d5bff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}
