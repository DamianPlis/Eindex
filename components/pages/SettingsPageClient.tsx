"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  updateSettingsAction,
  addCustomSubjectAction,
  updateSubjectAction,
  deleteSubjectAction,
} from "@/app/(app)/actions";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { localizePath, stripLocaleFromPath } from "@/lib/i18n/routing";
import { applyTheme } from "@/lib/settings/client";
import type { AppSettings, AppTheme } from "@/lib/settings/types";
import type { Subject } from "@/lib/schedule/types";
import { getClientId } from "@/lib/sync/client-id";
import DarkModeIcon from "@/icons/dark_mode_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import LightModeIcon from "@/icons/light_mode_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import type { AppLocale } from "@/lib/i18n/config";
import CustomSubjectModal from "@/components/planning/CustomSubjectModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AddIcon from "@/icons/add_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import SettingsPageSkeleton from "@/components/skeletons/SettingsPageSkeleton";
import { useSettingsRefresh } from "@/components/settings/SettingsRefreshContext";

type SettingsPageClientProps = {
  initialSettings: AppSettings;
  initialSubjects: Subject[];
};

type PendingAction = "theme" | "locale" | null;

const themeOptions = [
  {
    value: "light",
    icon: LightModeIcon,
    labelKey: "light",
  },
  {
    value: "dark",
    icon: DarkModeIcon,
    labelKey: "dark",
  },
] as const;

export default function SettingsPageClient({
  initialSettings,
  initialSubjects,
}: SettingsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const messages = useMessages();
  const { isRefreshing, refreshSettings } = useSettingsRefresh();
  const clientIdRef = useRef("");
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);
  const [subjects, setSubjects] = useState(initialSubjects);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [subjectPendingDelete, setSubjectPendingDelete] =
    useState<Subject | null>(null);

  useEffect(() => {
    clientIdRef.current = getClientId();
  }, []);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  function handleThemeSelect(nextTheme: AppTheme) {
    if (nextTheme === settings.theme) return;

    const previousSettings = settings;
    const optimisticSettings = {
      ...settings,
      theme: nextTheme,
    };

    setSettings(optimisticSettings);
    setPendingAction("theme");
    setErrorMessage("");
    applyTheme(nextTheme);

    startTransition(async () => {
      try {
        const savedSettings = await updateSettingsAction({
          theme: nextTheme,
          writerId: clientIdRef.current,
        });
        setSettings(savedSettings);
        applyTheme(savedSettings.theme);
        refreshSettings();
      } catch {
        setSettings(previousSettings);
        setErrorMessage(messages.settings.themeSaveError);
        applyTheme(previousSettings.theme);
      } finally {
        setPendingAction(null);
      }
    });
  }

  function handleLocaleChange(nextLocale: AppLocale) {
    if (nextLocale === settings.locale) return;

    const previousSettings = settings;
    const optimisticSettings = {
      ...settings,
      locale: nextLocale,
    };
    const query = searchParams.toString();
    const nextPath = localizePath(
      nextLocale,
      `${stripLocaleFromPath(pathname || "/")}${query ? `?${query}` : ""}`,
    );

    setSettings(optimisticSettings);
    setPendingAction("locale");
    setErrorMessage("");

    startTransition(async () => {
      try {
        const savedSettings = await updateSettingsAction({
          locale: nextLocale,
          writerId: clientIdRef.current,
        });
        setSettings(savedSettings);
        refreshSettings();
        router.replace(nextPath);
      } catch {
        setSettings(previousSettings);
        setPendingAction(null);
        setErrorMessage(messages.settings.languageSaveError);
      }
    });
  }

  function handleAddSubject() {
    setCustomModalOpen(true);
  }

  function handleUpdateSubject(id: string) {
    if (!editName.trim()) return;
    startTransition(async () => {
      await updateSubjectAction({
        id,
        name: editName,
        color: editColor,
        writerId: clientIdRef.current,
      });
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === id ? { id, name: editName, color: editColor } : s,
        ),
      );
      setEditingSubjectId(null);
      refreshSettings();
    });
  }

  function handleDeleteSubject(id: string) {
    const subject = subjects.find((current) => current.id === id);
    if (!subject) return;
    setSubjectPendingDelete(subject);
  }

  function confirmDeleteSubject() {
    if (!subjectPendingDelete) return;
    const id = subjectPendingDelete.id;

    startTransition(async () => {
      await deleteSubjectAction({ id, writerId: clientIdRef.current });
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      setSubjectPendingDelete(null);
      refreshSettings();
    });
  }

  function closeCustomSubjectModal() {
    setCustomModalOpen(false);
  }

  function handleSaveCustomSubject(name: string, color: string) {
    startTransition(async () => {
      const id = await addCustomSubjectAction({
        name,
        color,
        writerId: clientIdRef.current,
      });
      if (id) {
        setSubjects((prev) => [...prev, { id, name, color }]);
      }
      closeCustomSubjectModal();
      refreshSettings();
    });
  }

  const languageOptions: Array<{
    locale: AppLocale;
    label: string;
    flagSrc: string;
    countryCode: string;
  }> = [
    {
      locale: "cs",
      label: messages.common.czech,
      flagSrc: "/flags/cs.svg",
      countryCode: "CZ",
    },
    {
      locale: "en",
      label: messages.common.english,
      flagSrc: "/flags/en.svg",
      countryCode: "GB",
    },
    {
      locale: "pl",
      label: messages.common.polish,
      flagSrc: "/flags/pl.svg",
      countryCode: "PL",
    },
  ];

  const currentThemeLabel =
    settings.theme === "dark" ? messages.common.dark : messages.common.light;
  const currentLanguageLabel =
    languageOptions.find((option) => option.locale === settings.locale)
      ?.label || messages.common.czech;

  if (isRefreshing) return <SettingsPageSkeleton />;

  return (
    <div className="main-container settings-page">
      <div className="container settings-container">
        <header className="settings-header">
          <h2 className="settings-title">{messages.settings.title}</h2>
        </header>

        <section className="settings-section">
          <div className="settings-section-heading">
            <h3>{messages.settings.currentTheme}</h3>
            <span className="capitalize settings-current-value">
              {currentThemeLabel}
            </span>
          </div>

          <div className="settings-option-grid settings-option-grid-compact">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = settings.theme === option.value;
              const label =
                option.labelKey === "dark"
                  ? messages.common.dark
                  : messages.common.light;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleThemeSelect(option.value)}
                  className={`settings-choice-button theme-choice-button capitalize ${
                    isActive ? "is-active" : ""
                  } ${isPending && pendingAction === "theme" ? "pending" : ""}`}
                  disabled={isPending && pendingAction === "theme"}
                  aria-pressed={isActive}
                  aria-label={label}
                >
                  <span className="settings-choice-icon">
                    <Icon fill="currentColor" />
                  </span>
                  <span className="settings-choice-label">{label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-heading">
            <h3>{messages.settings.currentLanguage}</h3>
            <span className="settings-current-value">
              {pendingAction === "locale"
                ? messages.common.saving
                : currentLanguageLabel}
            </span>
          </div>

          <div className="settings-option-grid language-option-grid">
            {languageOptions.map((option) => {
              const isActive = settings.locale === option.locale;
              return (
                <button
                  key={option.locale}
                  className={`settings-choice-button language-choice-button ${
                    isActive ? "is-active" : ""
                  } ${
                    isPending && pendingAction === "locale" ? "pending" : ""
                  }`}
                  type="button"
                  onClick={() => handleLocaleChange(option.locale)}
                  disabled={isPending || isActive}
                  aria-pressed={isActive}
                  aria-label={option.label}
                >
                  <span className="language-flag-frame">
                    <Image
                      src={option.flagSrc}
                      alt=""
                      width={34}
                      height={24}
                      className="language-flag"
                    />
                  </span>
                  <span className="language-choice-text">
                    <span className="settings-choice-label">
                      {option.label}
                    </span>
                    <span className="language-choice-code">
                      {option.countryCode}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {errorMessage ? (
          <p className="settings-error-message">{errorMessage}</p>
        ) : null}

        <section className="settings-section subjects-settings-section">
          <div className="settings-section-heading subjects-list-header">
            <h3>{messages.settings.subjects}</h3>
            <button
              className="deadline-plus-button settings-add-subject-button"
              type="button"
              onClick={handleAddSubject}
              disabled={isPending}
              title={messages.planning.addCustomSubjectTitle}
              aria-label={messages.planning.addCustomSubjectTitle}
            >
              <AddIcon fill="currentColor" />
            </button>
          </div>

          <div className="subjects-list">
            {subjects.map((subject) => (
              <div key={subject.id} className="subject-item">
                {editingSubjectId === subject.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="subject-input"
                    />
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="subject-color-picker"
                    />
                    <div className="subject-actions">
                      <button
                        className="subject-action-btn save"
                        onClick={() => handleUpdateSubject(subject.id)}
                        disabled={isPending}
                      >
                        {messages.common.save}
                      </button>
                      <button
                        className="subject-action-btn"
                        onClick={() => setEditingSubjectId(null)}
                        disabled={isPending}
                      >
                        {messages.common.cancel}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className="subject-color-dot"
                      style={{ backgroundColor: subject.color }}
                    />
                    <span className="subject-name">{subject.name}</span>
                    <div className="subject-actions">
                      <button
                        className="subject-action-btn"
                        onClick={() => {
                          setEditingSubjectId(subject.id);
                          setEditName(subject.name);
                          setEditColor(subject.color);
                        }}
                        disabled={isPending}
                      >
                        {messages.common.edit}
                      </button>
                      <button
                        className="subject-action-btn delete"
                        onClick={() => handleDeleteSubject(subject.id)}
                        disabled={isPending}
                      >
                        {messages.common.delete}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <CustomSubjectModal
            isOpen={customModalOpen}
            isPending={isPending}
            messages={messages}
            onClose={closeCustomSubjectModal}
            onSave={handleSaveCustomSubject}
          />
          <ConfirmDialog
            isOpen={Boolean(subjectPendingDelete)}
            isPending={isPending}
            title="Delete Subject"
            cancelLabel={messages.common.cancel}
            confirmLabel={messages.common.delete}
            onCancel={() => setSubjectPendingDelete(null)}
            onConfirm={confirmDeleteSubject}
          >
            <p>
              Delete &quot;{subjectPendingDelete?.name}&quot; from your
              subjects?
            </p>
          </ConfirmDialog>
        </section>
      </div>
    </div>
  );
}
