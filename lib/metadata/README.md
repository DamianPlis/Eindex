# Eindex Smart Metadata Provider

Centralized, localized, and clean SEO & OpenGraph metadata manager for **Eindex** (`cs-CZ` default).

## Features

- 🇨🇿 **Czech First (`cs-CZ`)**: Default primary language and locale fallbacks set to Czech (`cs`).
- 🌐 **Full i18n Localization**: Supports `cs`, `en`, and `pl` out of the box with zero page clutter.
- 🚀 **1-Line Route Metadata**: Keep App Router route files completely clean.
- 📱 **OpenGraph & Twitter Cards**: Unified social media previews (1200x630 OG image, icons, canonical URLs).
- 🏷️ **Naming Consistency**: Guarantees app name is consistently `Eindex`.

---

## Directory Structure

```
lib/metadata/
├── config.ts        # Global site metadata constants (domain, branding, OG locales)
├── translations.ts  # Localized titles, descriptions, and keywords (cs-CZ, en-US, pl-PL)
├── provider.ts      # Core helpers: getRootMetadata() & generatePageMetadata()
├── index.ts         # Public API barrel export
└── README.md        # Documentation
```

---

## Usage Examples

### 1. Root Layout (`app/layout.tsx`)

```tsx
import { getRootMetadata } from "@/lib/metadata";

export const metadata = getRootMetadata();
```

### 2. Localized Pages (`app/[locale]/.../page.tsx`)

```tsx
import { generatePageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return generatePageMetadata({ page: "deadlines", locale });
}
```

### 3. Dynamic Pages (e.g. Single Deadline Detail)

```tsx
import { generatePageMetadata } from "@/lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return generatePageMetadata({
    page: "deadlines",
    locale,
    customTitle: `Detail úkolu #${id}`,
    path: `/deadlines/${id}`,
  });
}
```
