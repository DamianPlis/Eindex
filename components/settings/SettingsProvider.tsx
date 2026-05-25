"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  updateSettingsAction,
  addCustomSubjectAction,
  updateSubjectAction,
  deleteSubjectAction,
  addSubjectGroupAction,
  updateSubjectGroupAction,
  deleteSubjectGroupAction,
} from "@/app/(app)/actions";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { localizePath, stripLocaleFromPath } from "@/lib/i18n/routing";
import { applyTheme } from "@/lib/settings/client";
import type { AppSettings, AppTheme } from "@/lib/settings/types";
import type { Subject, SubjectGroup } from "@/lib/schedule/types";
import { getClientId } from "@/lib/sync/client-id";
import type { AppLocale } from "@/lib/i18n/config";
import { useSettingsRefresh } from "@/components/settings/SettingsRefreshContext";

type PendingAction = "theme" | "locale" | "schoolYear" | null;

type SettingsContextValue = {
  settings: AppSettings;
  subjects: Subject[];
  subjectGroups: SubjectGroup[];
  isPending: boolean;
  pendingAction: PendingAction;
  errorMessage: string;
  isRefreshing: boolean;
  handleThemeSelect: (theme: AppTheme) => void;
  handleLocaleChange: (locale: AppLocale) => void;
  handleSchoolYearToggle: (checked: boolean) => void;
  handleAddSubject: () => void;
  handleUpdateSubject: (id: string) => void;
  handleDeleteSubject: (id: string) => void;
  confirmDeleteSubject: () => void;
  handleSaveCustomSubject: (name: string, color: string) => void;
  closeCustomSubjectModal: () => void;
  editingSubjectId: string | null;
  editName: string;
  editColor: string;
  setEditingSubjectId: (id: string | null) => void;
  setEditName: (name: string) => void;
  setEditColor: (color: string) => void;
  customModalOpen: boolean;
  subjectPendingDelete: Subject | null;
  setSubjectPendingDelete: (subject: Subject | null) => void;
  handleAddSubjectGroup: (name: Record<string, string>, subjectIds: string[], namePreferences?: Record<string, string>) => void;
  handleUpdateSubjectGroup: (id: string, name: Record<string, string>, subjectIds: string[], namePreferences?: Record<string, string>) => void;
  handleDeleteSubjectGroup: (id: string) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

type SettingsProviderProps = {
  initialSettings: AppSettings;
  initialSubjects: Subject[];
  initialSubjectGroups: SubjectGroup[];
  children: ReactNode;
};

export default function SettingsProvider({
  initialSettings,
  initialSubjects,
  initialSubjectGroups,
  children,
}: SettingsProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const messages = useMessages();
  const { isRefreshing, refreshSettings } = useSettingsRefresh();
  const clientIdRef = useRef("");
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);
  const [subjects, setSubjects] = useState(initialSubjects);
  const [subjectGroups, setSubjectGroups] = useState(initialSubjectGroups);
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
    const optimisticSettings = { ...settings, theme: nextTheme };
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
    const optimisticSettings = { ...settings, locale: nextLocale };
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

  function handleSchoolYearToggle(checked: boolean) {
    const previousSettings = settings;
    const optimisticSettings = { ...settings, useSchoolYear: checked };
    setSettings(optimisticSettings);
    setPendingAction("schoolYear");
    setErrorMessage("");

    startTransition(async () => {
      try {
        const savedSettings = await updateSettingsAction({
          useSchoolYear: checked,
          writerId: clientIdRef.current,
        });
        setSettings(savedSettings);
        refreshSettings();
      } catch {
        setSettings(previousSettings);
        setErrorMessage(messages.settings.schoolYearSaveError);
      } finally {
        setPendingAction(null);
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

  function handleAddSubjectGroup(name: Record<string, string>, subjectIds: string[], namePreferences?: Record<string, string>) {
    startTransition(async () => {
      const id = await addSubjectGroupAction({
        name,
        subjectIds,
        namePreferences,
        writerId: clientIdRef.current,
      });
      if (id) {
        setSubjectGroups((prev) => [...prev, { id, name, subjectIds, namePreferences }]);
      }
      refreshSettings();
    });
  }

  function handleUpdateSubjectGroup(id: string, name: Record<string, string>, subjectIds: string[], namePreferences?: Record<string, string>) {
    startTransition(async () => {
      await updateSubjectGroupAction({
        id,
        name,
        subjectIds,
        namePreferences,
        writerId: clientIdRef.current,
      });
      setSubjectGroups((prev) =>
        prev.map((g) => (g.id === id ? { id, name, subjectIds, namePreferences } : g)),
      );
      refreshSettings();
    });
  }

  function handleDeleteSubjectGroup(id: string) {
    startTransition(async () => {
      await deleteSubjectGroupAction({ id, writerId: clientIdRef.current });
      setSubjectGroups((prev) => prev.filter((g) => g.id !== id));
      refreshSettings();
    });
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        subjects,
        subjectGroups,
        isPending,
        pendingAction,
        errorMessage,
        isRefreshing,
        handleThemeSelect,
        handleLocaleChange,
        handleSchoolYearToggle,
        handleAddSubject,
        handleUpdateSubject,
        handleDeleteSubject,
        confirmDeleteSubject,
        handleSaveCustomSubject,
        closeCustomSubjectModal,
        editingSubjectId,
        editName,
        editColor,
        setEditingSubjectId,
        setEditName,
        setEditColor,
        customModalOpen,
        subjectPendingDelete,
        setSubjectPendingDelete,
        handleAddSubjectGroup,
        handleUpdateSubjectGroup,
        handleDeleteSubjectGroup,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
