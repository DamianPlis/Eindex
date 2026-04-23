import type { Metadata, Viewport } from "next";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import PwaRegistrar from "@/components/pwa/PwaRegistrar";
import { getMessages } from "@/lib/i18n/messages";
import { getPreferredLocale } from "@/lib/i18n/preference";
import { getSession } from "@/lib/session";
import NoScriptNotice from "@/components/layout/NoScriptNotice";
import { getUserSettingsMaybe } from "@/lib/schedule/store";
import "../css/globals.css";
import "../css/noscript.css";
import "../css/planning.css";
import "../css/topbar.css";
import "../css/skeletons.css";

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
  const session = await getSession();
  const [locale, settings] = await Promise.all([
    getPreferredLocale(session),
    getUserSettingsMaybe(session?.uid ?? null),
  ]);
  const messages = getMessages(locale);

  return (
    <html lang={locale} data-theme={settings?.theme}>
      <body>
        <noscript>
          <NoScriptNotice messages={messages.noscript} />
        </noscript>
        <LocaleProvider locale={locale} messages={messages} uid={session?.uid}>
          <PwaRegistrar />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
