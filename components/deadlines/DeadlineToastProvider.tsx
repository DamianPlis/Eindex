"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMessages } from "@/components/i18n/UserSyncProvider";
import { markAsDoneDeadlineAction, removeDeadlineAction, undoDeadlineAction } from "@/app/(app)/actions";
import type { DeadlineUndo } from "@/lib/schedule/deadline-undo";
import CheckIcon from "@/icons/check_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import CloseIcon from "@/icons/close_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg";
import s from "./DeadlineToastProvider.module.css";

type Notice = {
  id: string;
  undo?: DeadlineUndo;
  state: "ready" | "undoing" | "restored" | "error";
};
type Actions = {
  perform: (kind: DeadlineUndo["kind"], id: string) => Promise<void>;
  pendingIds: ReadonlySet<string>;
};
const Context = createContext<Actions | null>(null);

export function useDeadlineActions() {
  const context = useContext(Context);
  if (!context) throw new Error("Deadline actions require DeadlineToastProvider");
  return context;
}

export function DeadlineToastProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const messages = useMessages().deadlines.toast;
  const [notices, setNotices] = useState<Notice[]>([]);
  const locks = useRef(new Set<string>());
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());
  const dismiss = useCallback((id: string) => {
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }, []);

  function lock(id: string) {
    if (locks.current.has(id)) return false;
    locks.current.add(id);
    setPendingIds(new Set(locks.current));
    return true;
  }
  function unlock(id: string) {
    locks.current.delete(id);
    setPendingIds(new Set(locks.current));
  }

  async function perform(kind: DeadlineUndo["kind"], id: string) {
    if (!lock(id)) return;
    try {
      const form = new FormData();
      form.set("id", id);
      const undo = await (kind === "remove" ? removeDeadlineAction(form) : markAsDoneDeadlineAction(form));
      if (undo) setNotices((current) => [...current, { id: crypto.randomUUID(), undo, state: "ready" }]);
      router.refresh();
    } catch {
      setNotices((current) => [...current, { id: crypto.randomUUID(), state: "error" }]);
    } finally {
      unlock(id);
    }
  }

  async function undoNotice(notice: Notice) {
    if (!notice.undo || !lock(notice.undo.deadline.id)) return;
    const update = (state: Notice["state"]) => setNotices((current) =>
      current.map((item) => item.id === notice.id ? { ...item, state } : item));
    update("undoing");
    try {
      await undoDeadlineAction(notice.undo);
      update("restored");
      router.refresh();
    } catch {
      update("error");
    } finally {
      unlock(notice.undo.deadline.id);
    }
  }

  return (
    <Context.Provider value={{ perform, pendingIds }}>
      {children}
      <section className={s.viewport} aria-label={messages.notifications}
        aria-live="polite" aria-relevant="additions text">
        {/* Queued notices get their full undo window when they become visible. */}
        {notices.slice(0, 3).map((notice) => (
          <DeadlineToast key={notice.id} notice={notice} onDismiss={dismiss}
            onUndo={() => void undoNotice(notice)}
            busy={!!notice.undo && pendingIds.has(notice.undo.deadline.id)} />
        ))}
      </section>
    </Context.Provider>
  );
}

function DeadlineToast({ notice, onDismiss, onUndo, busy }: {
  notice: Notice;
  onDismiss: (id: string) => void;
  onUndo: () => void;
  busy: boolean;
}) {
  const messages = useMessages().deadlines.toast;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const dismissButton = useRef<HTMLButtonElement>(null);
  const remaining = useRef(10000);
  const paused = hovered || focused || hidden || busy;
  const { id, state, undo } = notice;

  useEffect(() => {
    // Keep keyboard focus in the toast when its Undo button disappears.
    if (state === "restored" && focused) dismissButton.current?.focus();
  }, [state, focused]);

  useEffect(() => {
    const update = () => setHidden(document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    remaining.current = state === "restored" ? 3000 : 10000;
  }, [state]);

  useEffect(() => {
    if (paused || state === "error" || state === "undoing") return;
    const started = Date.now();
    const timer = setTimeout(() => onDismiss(id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - started));
    };
  }, [id, onDismiss, paused, state]);

  const title = state === "error" ? (undo ? messages.undoFailed : messages.actionFailed)
    : state === "restored" ? messages.restored
    : state === "undoing" ? messages.undoing
    : undo?.kind === "remove" ? messages.removed : messages.done;
  const canUndo = !!undo && state !== "restored";

  return (
    <div className={`${s.toast} ${state === "error" ? s.error : ""}`}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}>
      <span className={`${s.icon} ${undo?.kind === "remove" && state === "ready" ? s.removed : ""}`} aria-hidden="true">
        {state === "error" ? "!" : undo?.kind === "remove" && state !== "restored"
          ? <CloseIcon width="20" height="20" fill="currentColor" />
          : <CheckIcon width="20" height="20" fill="currentColor" />}
      </span>
      <div className={s.copy} aria-atomic="true">
        <p className={s.title}>{title}</p>
        {undo ? <p className={s.description} title={undo.deadline.text}>{undo.deadline.text}</p> : null}
      </div>
      {canUndo ? <button type="button" className={s.undo} onClick={onUndo}
        disabled={busy} aria-busy={state === "undoing"}
        aria-label={`${messages.undo}: ${undo.deadline.text}`}>
        {state === "undoing" ? messages.undoing : messages.undo}
      </button> : null}
      <button ref={dismissButton} type="button" className={s.dismiss} onClick={() => onDismiss(id)}
        disabled={state === "undoing"} aria-label={messages.dismiss}>
        <CloseIcon width="18" height="18" fill="currentColor" aria-hidden="true" />
      </button>
    </div>
  );
}
