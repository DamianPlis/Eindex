import type { Metadata, Viewport } from "next";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { UserSyncProvider } from "@/components/i18n/UserSyncProvider";
import PwaRegistrar from "@/components/pwa/PwaRegistrar";
import { getMessages } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/server";
import NoScriptNotice from "@/components/layout/NoScriptNotice";
import { getThemeCookie } from "@/lib/settings/theme-cookie";
import { getRootMetadata } from "@/lib/metadata";
import "../css/globals.css";

export const metadata: Metadata = getRootMetadata();

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
  // Cookie preferences prevent theme and locale flashes before hydration.
  const [cookieTheme, locale] = await Promise.all([
    getThemeCookie(),
    getRequestLocale(),
  ]);
  const messages = getMessages(locale);

  return (
    <ConvexAuthNextjsServerProvider>
      <html
        lang={locale}
        data-theme={cookieTheme ?? undefined}
        suppressHydrationWarning
      >
        <head>
          <script dangerouslySetInnerHTML={{ __html: THEME_FLASH_SCRIPT }} />
        </head>
        <body>
          <noscript>
            <NoScriptNotice messages={messages.noscript} />
          </noscript>
          <ConvexClientProvider>
            <UserSyncProvider locale={locale} messages={messages}>
              <PwaRegistrar />
              {children}
            </UserSyncProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
