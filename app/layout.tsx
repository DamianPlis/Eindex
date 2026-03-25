import type { Metadata, Viewport } from "next";
import PwaRegistrar from "@/components/pwa/PwaRegistrar";
import "@/app/globals.css";

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
  themeColor: "#ff7fbf",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}
