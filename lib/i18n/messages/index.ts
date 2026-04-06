import type { AppLocale } from "@/lib/i18n/config";
import { csMessages } from "./cs";
import { enMessages } from "./en";

export type AppMessages = typeof enMessages;

const allMessages: Record<AppLocale, AppMessages> = {
  en: enMessages,
  cs: csMessages,
};

export function getMessages(locale: AppLocale): AppMessages {
  return allMessages[locale];
}
