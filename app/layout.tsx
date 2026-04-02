import type { Metadata, Viewport } from "next";
import PwaRegistrar from "@/components/pwa/PwaRegistrar";
import "./globals.css";
import NoScriptNotice from "@/components/layout/NoScriptNotice";


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
        <noscript  >
          <NoScriptNotice />
        </noscript>
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}
