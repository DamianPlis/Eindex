import type { AppLocale } from "@/lib/i18n/config";
import { csMessages } from "./cs";
import { enMessages } from "./en";
import { plMessages } from "./pl";

export type AppMessages = typeof enMessages;

const allMessages: Record<AppLocale, AppMessages> = {
  en: enMessages,
  cs: csMessages,
  pl: plMessages,
};

export function getMessages(locale: AppLocale): AppMessages {
  return allMessages[locale];
}
