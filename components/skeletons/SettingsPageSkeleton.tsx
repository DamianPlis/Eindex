import SkeletonLine from "@/components/skeletons/SkeletonLine";

export default function SettingsPageSkeleton() {
  return (
    <div className="main-container settings-page" aria-hidden="true">
      <div className="container settings-container">
        <header className="settings-header">
          <SkeletonLine className="settings-skeleton-title" />
        </header>

        <section className="settings-section">
          <div className="settings-section-heading">
            <SkeletonLine className="settings-skeleton-heading" />
            <SkeletonLine className="settings-skeleton-pill" />
          </div>
          <div className="settings-option-grid settings-option-grid-compact">
            <SkeletonLine className="settings-skeleton-choice" />
            <SkeletonLine className="settings-skeleton-choice" />
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-heading">
            <SkeletonLine className="settings-skeleton-heading" />
            <SkeletonLine className="settings-skeleton-pill" />
          </div>
          <div className="settings-option-grid language-option-grid">
            {[0, 1, 2].map((index) => (
              <SkeletonLine
                key={`settings-language-skeleton-${index}`}
                className="settings-skeleton-language-choice"
              />
            ))}
          </div>
        </section>

        <section className="settings-section subjects-settings-section">
          <div className="settings-section-heading subjects-list-header">
            <SkeletonLine className="settings-skeleton-heading" />
            <SkeletonLine className="skeleton-action-circle" />
          </div>
          <div className="subjects-list">
            {[0, 1, 2, 3, 4].map((index) => (
              <div
                key={`settings-subject-skeleton-${index}`}
                className="subject-item settings-skeleton-subject"
              >
                <SkeletonLine className="skeleton-action-circle" />
                <SkeletonLine className="skeleton-text-line-md" />
                <div className="subject-actions">
                  <SkeletonLine className="skeleton-pill" />
                  <SkeletonLine className="skeleton-pill" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
