import { AppLocale } from "@/lib/i18n/config";

export interface PageMetadataDefinition {
  title: string;
  description: string;
  keywords?: string[];
}

export type PageKey =
  | "root"
  | "home"
  | "login"
  | "planning"
  | "deadlines"
  | "settings"
  | "sudoku"
  | "mandala"
  | "about";

/**
 * Localized metadata dictionary for Eindex application.
 * Default and primary language is Czech (cs-CZ).
 */
export const LOCALIZED_METADATA: Record<AppLocale, Record<PageKey, PageMetadataDefinition>> = {
  cs: {
    root: {
      title: "Eindex — Moderní školní rozvrh, úkoly a jídelníček",
      description:
        "Mějte školu pod kontrolou s Eindex. Sledujte týdenní rozvrh hodin, spravujte domácí úkoly a termíny, prohlížejte statistiky předmětů a zobrazte si dnešní oběd ze školní jídelny — vše v reálném čase a synchronizované napříč všemi zařízeními.",
      keywords: [
        "Eindex",
        "školní rozvrh",
        "rozvrh hodin",
        "plánovač pro studenty",
        "domácí úkoly",
        "jídelníček",
        "jidelna.cz",
        "školní aplikace",
        "statistika předmětů",
        "PWA rozvrh",
      ],
    },
    home: {
      title: "Dnešní rozvrh a přehled",
      description: "Dnešní rozvrh hodin, nadcházející úkoly a aktuální menu ze školní jídelny na jednom místě.",
    },
    login: {
      title: "Přihlášení",
      description: "Přihlaste se do Eindex pro synchronizaci školního rozvrhu, úkolů a nastavení v reálném čase.",
    },
    planning: {
      title: "Týdenní plánovač rozvrhu",
      description: "Přizpůsobte si svůj týdenní rozvrh hodin, přiřazujte předměty do časových bloků a plánujte probíraná témata.",
    },
    deadlines: {
      title: "Úkoly a termíny",
      description: "Sledujte své domácí úkoly, termíny zkoušek, stav jejich splnění a přehledné statistiky předmětů.",
    },
    settings: {
      title: "Nastavení",
      description: "Upravte si vzhled, jazykové předvolby, vlastní předměty a skupiny předmětů v aplikaci Eindex.",
    },
    sudoku: {
      title: "Sudoku pro procvičení mozku",
      description: "Dejte si pauzu mezi hodinami a procvičte si mysl s interaktivním i logickými Sudoku rébusy.",
    },
    mandala: {
      title: "Relaxační mandaly",
      description: "Zastavte se, vybarvujte a uvolněte svou mysl kreativitou mezi studijními bloky.",
    },
    about: {
      title: "O aplikaci Eindex",
      description: "Eindex je server-first školní plánovač navržený pro přehlednou organizaci výuky, úkolů a školního jídelníčku.",
    },
  },
  en: {
    root: {
      title: "Eindex — Real-Time School Planning, Homework & Lunch Menus",
      description:
        "Master your school week with Eindex. Track your weekly timetable, manage homework deadlines with smart countdowns, view subject statistics, and check daily cafeteria lunch menus — synced instantly across all your devices.",
      keywords: [
        "Eindex",
        "school planner",
        "timetable manager",
        "homework tracker",
        "student app",
        "lunch menu scraper",
        "weekly schedule",
        "realtime sync",
      ],
    },
    home: {
      title: "Today's Schedule & Overview",
      description: "Your daily timetable, upcoming homework deadlines, and current school lunch menu in one place.",
    },
    login: {
      title: "Sign In",
      description: "Sign in to Eindex to sync your school timetable, homework deadlines, and settings across all your devices.",
    },
    planning: {
      title: "Weekly Timetable Planning",
      description: "Manage your weekly timetable, assign subjects to time slots, add lesson topics, and organize your school week.",
    },
    deadlines: {
      title: "Homework & Deadlines",
      description: "Keep track of upcoming homework deadlines, exam dates, completion status, and subject frequency statistics.",
    },
    settings: {
      title: "Settings",
      description: "Configure your theme, language preferences, custom subjects, and subject groups in Eindex.",
    },
    sudoku: {
      title: "Sudoku Brain Training",
      description: "Take a break between classes and exercise your mind with interactive Sudoku puzzles.",
    },
    mandala: {
      title: "Mandala Mind Rest",
      description: "Pause, color, and relax your mind between study sessions with creative mandala coloring.",
    },
    about: {
      title: "About Eindex",
      description: "Eindex is a server-first school planning app designed to keep your academic life organized in real-time.",
    },
  },
  pl: {
    root: {
      title: "Eindex — Nowoczesny plan zajęć, zadania i jadłospis",
      description:
        "Zarządzaj swoim tygodniem szkolnym z Eindex. Śledź tygodniowy plan lekcji, zadania domowe, statystyki przedmiotów i jadłospis stołówki szkolnej na żywo synchronizowany na wszystkich urządzeniach.",
      keywords: [
        "Eindex",
        "plan lekcji",
        "terminarz szkolny",
        "zadania domowe",
        "aplikacja dla uczniów",
        "jadłospis stołówki",
        "plan tygodniowy",
      ],
    },
    home: {
      title: "Dzisiejszy plan i podsumowanie",
      description: "Dzisiejszy plan lekcji, nadchodzące zadania oraz jadłospis stołówki szkolnej w jednym miejscu.",
    },
    login: {
      title: "Zaloguj się",
      description: "Zaloguj się do Eindex, aby synchronizować plan lekcji, zadania domowe i ustawienia na wszystkich urządzeniach.",
    },
    planning: {
      title: "Tygodniowy plan zajęć",
      description: "Zarządzaj swoim tygodniowym planem lekcji, przypisuj przedmioty do bloków czasowych i dodawaj tematy zajęć.",
    },
    deadlines: {
      title: "Zadania i terminy",
      description: "Śledź swoje zadania domowe, terminy egzaminów, status wykonania oraz statystyki przedmiotów.",
    },
    settings: {
      title: "Ustawienia",
      description: "Dostosuj motyw, preferencje językowe, własne przedmioty i grupy przedmiotów w aplikacji Eindex.",
    },
    sudoku: {
      title: "Sudoku dla umysłu",
      description: "Zrób przerwę między lekcjami i ćwicz umysł za pomocą interaktywnych łamigłówek Sudoku.",
    },
    mandala: {
      title: "Kreatywne mandale",
      description: "Zatrzymaj się, koloruj i zrelaksuj swój umysł między blokami nauki.",
    },
    about: {
      title: "O aplikacji Eindex",
      description: "Eindex to aplikacja do planowania szkolnego stworzona z myślą o organizacji zajęć i zadań.",
    },
  },
};
