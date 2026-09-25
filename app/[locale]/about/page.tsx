import type { Metadata } from "next";
import { assertLocale } from "@/lib/i18n/server";
import { getMessages } from "@/lib/i18n/messages";
import Link from "next/link";
import { localizePath } from "@/lib/i18n/routing";
import { normalizeAppLocale } from "@/lib/i18n/config";
import CalendarIcon from "@/icons/calendar.svg";
import ChecklistIcon from "@/icons/checklist.svg";
import RestaurantIcon from "@/icons/restaurant.svg";
import SyncIcon from "@/icons/sync.svg";
import s from "./page.module.css";
import u from "@/components/ui/shared.module.css";
import { generatePageMetadata } from "@/lib/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  assertLocale(locale);
  return generatePageMetadata({ page: "about", locale, path: "/about" });
}

export default async function LocaleAboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  assertLocale(resolvedParams.locale);
  const locale = normalizeAppLocale(resolvedParams.locale);
  const messages = getMessages(locale);

  return (
    <div className={s.aboutScreen} id="about-page-container">
      <main className={`${u.container} ${s.aboutCard}`} id="about-card">
        <h1 className={s.aboutTitle} id="about-title">
          {messages.about.title}
        </h1>
        <p className={s.aboutDescription} id="about-description">
          {messages.about.description}
        </p>

        <section
          className={s.featuresList}
          id="about-features-section"
          aria-labelledby="features-heading"
        >
          <h2 className={s.featuresTitle} id="features-heading">
            {messages.about.featuresTitle}
          </h2>
          <div className={s.featureItem} id="feature-schedule">
            <CalendarIcon className={s.featureIcon} aria-hidden="true" />
            <p>{messages.about.featureSchedule}</p>
          </div>
          <div className={s.featureItem} id="feature-deadlines">
            <ChecklistIcon className={s.featureIcon} aria-hidden="true" />
            <p>{messages.about.featureDeadlines}</p>
          </div>
          <div className={s.featureItem} id="feature-lunches">
            <RestaurantIcon className={s.featureIcon} aria-hidden="true" />
            <p>{messages.about.featureLunches}</p>
          </div>
          <div className={s.featureItem} id="feature-sync">
            <SyncIcon className={s.featureIcon} aria-hidden="true" />
            <p>{messages.about.featureSync}</p>
          </div>
        </section>

        <Link
          href={localizePath(locale, "/login")}
          className={`${u.primaryButton} ${s.backButton}`}
          id="back-to-login-link"
        >
          {messages.about.backToLogin}
        </Link>
      </main>
    </div>
  );
}
