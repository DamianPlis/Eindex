# CSS Architecture Revamp Plan

This plan details the strategy for migrating the current monolithic `globals.css` approach to a more scalable, component-scoped CSS Modules architecture, while using Tailwind CSS efficiently for utility classes.

## Goal Description

The current `globals.css` file contains over 500 lines of CSS, mixing global variables/themes with highly specific component styles (e.g., `.reminder-card`, `.slot-bubble`, `.deadline-item`). As the application grows, this will lead to specificity conflicts, dead code, and difficult maintenance. 

This plan proposes:
1. **Keeping a strong global base:** `globals.css` will be stripped down to only contain CSS variables, dark mode themes, browser resets, and core element styling (html, body, basic typography).
2. **Adopting CSS Modules:** Extracting component-specific styles into `[component].module.css` files located alongside their respective React components.
3. **Strategic Tailwind Usage:** Utilizing Tailwind CSS strictly for one-off utility tweaks (e.g., margins, paddings, display utilities like `flex`) rather than complex component styling logic.

## Open Questions

1. Do you want to migrate all components at once, or feature-by-feature?
2. Are there any existing Tailwind utility classes currently in the JSX that you'd prefer we extract into the CSS modules as well, or should we strictly move what is currently in `globals.css`?

## Proposed Changes

### 1. Refactor `globals.css` (Base Styles)
Keep only the essentials in `css/globals.css`:
- Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`)
- `:root` and `[data-theme="dark"]` CSS variables
- Base HTML/Body resets and typography

#### [MODIFY] `css/globals.css`
Will remove all component specific classes.

### 2. Extract Component Styles to CSS Modules
We will create new `.module.css` files and move the corresponding styles from `globals.css`. Then, we will update the `.tsx` files to import and use these module classes.

#### [NEW] `components/layout/AppShell.module.css`
Move styles related to the main application shell, containers, and mode toggles:
- `.app-shell`, `.container`, `.main-container`
- `.ghost-button`, `.dark-mode-btn`, `.light-mode-btn`

#### [NEW] `components/features/Reminders.module.css`
- `.reminders-section`, `.reminder-card`, `.reminder-content`, `.reminder-title`, `.reminder-date`

#### [NEW] `components/features/Schedule.module.css`
- `.schedule-list`, `.slot-bubble`, `.slot-content`, `.slot-title-text`, `.slot-subtitle`, `.slot-time-text`

#### [NEW] `components/features/Deadlines.module.css`
- `.deadlines-container`, `.deadlines-title`, `.add-form`, `.deadline-item`, `.status-pill`, `.deadline-action-button`

#### [NEW] `components/features/Stats.module.css`
- `.stats-container`, `.stats-card`, `.stats-card-header`, `.stats-entry`

#### [NEW] `components/layout/Topbar.module.css`
- `.online-status-banner`, `.logout-button`, `.topbar-profile-menu`

### 3. Update React Components
For each component affected by the CSS extraction:
#### [MODIFY] Various `.tsx` files in `components/`
- Import the new CSS module: `import styles from './ComponentName.module.css';`
- Replace static strings with module references.
- Use `clsx` or template literals for combining module classes with Tailwind utilities (e.g., `` className={`${styles.reminderCard} mt-4`} ``).

## Verification Plan

### Manual Verification
- Verify that the application compiles without errors (`npm run dev`).
- Visually inspect the UI in the browser to ensure the layout, colors, and typography match the original design perfectly.
- Test dark mode toggling to ensure CSS variables cascade correctly into the CSS Modules.
