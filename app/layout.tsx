import type { Metadata, Viewport } from "next";
import { UserSyncProvider } from "@/components/i18n/UserSyncProvider";
import PwaRegistrar from "@/components/pwa/PwaRegistrar";
import { getMessages } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/server";
import NoScriptNotice from "@/components/layout/NoScriptNotice";
import { getThemeCookie } from "@/lib/settings/theme-cookie";
import "../css/globals.css";

export const metadata: Metadata = {
  title: "Eindex",
  description: "Server-first Next.js school planning app",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Eindex",
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

/**
 * Inline script that reads the eindx_theme cookie and sets data-theme
 * on <html> before the first paint — prevents dark mode flash.
 * ~130 bytes, runs synchronously.
 */
const THEME_FLASH_SCRIPT = `(function(){var m=document.cookie.match(/(?:^|;\\s*)eindx_theme=([^;]*)/);if(m&&m[1])document.documentElement.setAttribute("data-theme",m[1])})()`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Only cookie reads — no Firebase Admin, no Firestore, no network calls.
  const [cookieTheme, locale] = await Promise.all([
    getThemeCookie(),
    getRequestLocale(),
  ]);
  const messages = getMessages(locale);

  return (
    <html lang={locale} data-theme={cookieTheme ?? undefined} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_FLASH_SCRIPT }} />
      </head>
      <body>
        <noscript>
          <NoScriptNotice messages={messages.noscript} />
        </noscript>
        <UserSyncProvider locale={locale} messages={messages}>
          <PwaRegistrar />
          {children}
        </UserSyncProvider>
      </body>
    </html>
  );
}
