"use client";

import { useMessages } from "@/components/i18n/UserSyncProvider";
import { useSettings } from "@/components/settings/SettingsProvider";
import s from "@/components/settings/settings.module.css";

export default function StatisticsSection() {
  const messages = useMessages();
  const { settings, isPending, pendingAction, handleSchoolYearToggle } =
    useSettings();

  return (
    <section id="settings-statistics" className={s.section}>
      <div className={s.sectionHeading}>
        <h3>{messages.settings.statisticsSection}</h3>
      </div>

      <div className={s.toggleRow}>
        <div className={s.toggleText}>
          <span className={s.toggleLabel}>
            {messages.settings.useSchoolYear}
          </span>
          <span className={s.toggleDescription}>
            {messages.settings.useSchoolYearDescription}
          </span>
        </div>
        <label className={s.toggleSwitch}>
          <input
            type="checkbox"
            checked={settings.useSchoolYear}
            onChange={(e) => handleSchoolYearToggle(e.target.checked)}
            disabled={isPending && pendingAction === "schoolYear"}
          />
          <span className={s.toggleTrack} />
        </label>
      </div>
    </section>
  );
}
