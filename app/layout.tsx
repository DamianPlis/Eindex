import type { Metadata, Viewport } from "next";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import PwaRegistrar from "@/components/pwa/PwaRegistrar";
import { getMessages } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/server";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);

  return (
    <html lang={locale}>
      <body>
        <noscript  >
          <NoScriptNotice messages={messages.noscript} />
        </noscript>
        <LocaleProvider locale={locale} messages={messages}>
          <PwaRegistrar />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
