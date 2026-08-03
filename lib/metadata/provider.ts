import type { Metadata } from "next";
import { AppLocale, normalizeAppLocale } from "@/lib/i18n/config";
import { SITE_CONFIG, OG_LOCALES } from "./config";
import { LOCALIZED_METADATA, PageKey } from "../i18n/messages/metadata";

export interface GeneratePageMetadataOptions {
  page: PageKey;
  locale?: string;
  customTitle?: string;
  customDescription?: string;
  path?: string;
}

/**
 * Generates root metadata object for Next.js App Router (app/layout.tsx).
 * Defaults to Czech (cs-CZ) as the primary site language.
 */
export function getRootMetadata(): Metadata {
  const rootMeta = LOCALIZED_METADATA.cs.root;

  return {
    metadataBase: new URL(SITE_CONFIG.baseUrl),
    title: {
      default: rootMeta.title,
      template: `%s | ${SITE_CONFIG.name}`,
    },
    description: rootMeta.description,
    applicationName: SITE_CONFIG.name,
    authors: [{ name: `${SITE_CONFIG.name} Team` }],
    generator: "Next.js",
    keywords: rootMeta.keywords,
    referrer: "origin-when-cross-origin",
    creator: SITE_CONFIG.name,
    publisher: SITE_CONFIG.name,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: OG_LOCALES.cs,
      alternateLocale: [OG_LOCALES.en, OG_LOCALES.pl],
      url: "/",
      siteName: SITE_CONFIG.name,
      title: rootMeta.title,
      description: rootMeta.description,
      images: [
        {
          url: SITE_CONFIG.ogImage,
          width: 1200,
          height: 630,
          alt: rootMeta.title,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: rootMeta.title,
      description: rootMeta.description,
      images: [SITE_CONFIG.ogImage],
      creator: SITE_CONFIG.twitterHandle,
      site: SITE_CONFIG.twitterHandle,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: [{ url: SITE_CONFIG.iconSvg, type: "image/svg+xml" }],
      shortcut: SITE_CONFIG.iconSvg,
      apple: [
        { url: SITE_CONFIG.iconSvg, sizes: "180x180", type: "image/svg+xml" },
      ],
    },
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: SITE_CONFIG.name,
      statusBarStyle: "default",
    },
    alternates: {
      canonical: "/",
      languages: {
        "cs-CZ": "/cs",
        "en-US": "/en",
        "pl-PL": "/pl",
      },
    },
    category: "education",
  };
}

/**
 * Smart Metadata Generator for any localized page or segment route.
 * Reusable across all routes with 1 line of code.
 */
export function generatePageMetadata({
  page,
  locale: rawLocale,
  customTitle,
  customDescription,
  path = "",
}: GeneratePageMetadataOptions): Metadata {
  const verifiedLocale: AppLocale = normalizeAppLocale(rawLocale);
  const localeDict =
    LOCALIZED_METADATA[verifiedLocale] || LOCALIZED_METADATA.cs;
  const pageMeta =
    localeDict[page] || localeDict.home || LOCALIZED_METADATA.cs.root;

  const finalTitle = customTitle || pageMeta.title;
  const finalDescription = customDescription || pageMeta.description;
  const ogLocale = OG_LOCALES[verifiedLocale] || OG_LOCALES.cs;
  const canonicalUrl = `/${verifiedLocale}${path ? (path.startsWith("/") ? path : `/${path}`) : ""}`;

  return {
    title: finalTitle,
    description: finalDescription,
    keywords:
      pageMeta.keywords || LOCALIZED_METADATA[verifiedLocale].root.keywords,
    openGraph: {
      title: `${finalTitle} | ${SITE_CONFIG.name}`,
      description: finalDescription,
      locale: ogLocale,
      alternateLocale: Object.values(OG_LOCALES).filter(
        (loc) => loc !== ogLocale,
      ),
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      images: [
        {
          url: SITE_CONFIG.ogImage,
          width: 1200,
          height: 630,
          alt: `${finalTitle} — ${SITE_CONFIG.name}`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${finalTitle} | ${SITE_CONFIG.name}`,
      description: finalDescription,
      images: [SITE_CONFIG.ogImage],
      creator: SITE_CONFIG.twitterHandle,
    },
  };
}
