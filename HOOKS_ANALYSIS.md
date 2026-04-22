# React Hooks Rules Analysis Report

## Summary
After a comprehensive search of the codebase focusing on layout files, page components, and custom hooks, **no critical violations of the Rules of Hooks were found**. However, several patterns were identified that warrant attention for code quality and maintainability.

---

## Critical Issues
❌ **None found**

All hooks are called unconditionally at the top level of components before any conditional returns or early exits.

---

## Areas of Concern / Best Practice Issues

### 1. **Conditional Component Returns After Hook Calls** ⚠️
**Files Affected:**
- [components/planning/CustomSubjectModal.tsx](components/planning/CustomSubjectModal.tsx#L23-L25)
- [components/layout/OnlineStatusBanner.tsx](components/layout/OnlineStatusBanner.tsx#L9-L10)

**Pattern:**
```typescript
// CustomSubjectModal.tsx (lines 23-25)
const [customName, setCustomName] = useState("");
const [customColor, setCustomColor] = useState(DEFAULT_COLOR);

if (!isOpen) return null;  // ⚠️ Conditional return after hooks
```

**Issue:** While technically allowed by React's Rules of Hooks (hooks are called unconditionally), this pattern violates the spirit of the rule that "components must render the same number of hooks on every render." When `isOpen` is false, the component returns null without rendering the hooks' state into the DOM. This can be confusing and may lead to unexpected behavior.

**Recommendation:** 
- Move the early return before the hooks, or
- Use the hooks in the render output that respects the conditional state

**Better approach:**
```typescript
export default function CustomSubjectModal({ isOpen, ... }: CustomSubjectModalProps) {
  if (!isOpen) return null;  // Return BEFORE hooks
  
  const [customName, setCustomName] = useState("");
  const [customColor, setCustomColor] = useState(DEFAULT_COLOR);
  // ... rest of logic
}
```

---

### 2. **Potential Dependency Array Instability in LocaleProvider** ⚠️
**File:** [components/i18n/LocaleProvider.tsx](components/i18n/LocaleProvider.tsx#L79-L89)

**Pattern:**
```typescript
useEffect(() => {
  if (!pathname) return;
  const query = searchParams.toString();
  const currentPath = `${pathname}${query ? `?${query}` : ""}`;
  const currentPathLocale = getLocaleFromPathname(pathname);
  if (currentPathLocale === activeLocale) return;
  
  const nextPath = localizePath(activeLocale, currentPath);
  if (nextPath === currentPath) return;
  router.replace(nextPath);
}, [activeLocale, pathname, router, searchParams]);  // ⚠️ searchParams in deps
```

**Issue:** The `searchParams` object returned from `useSearchParams()` (Next.js hook) may return a new object reference on each render, even if the search parameters haven't changed. This could cause the effect to run repeatedly and trigger unnecessary router.replace() calls.

**Risk Level:** Medium - May cause performance issues or unexpected re-renders

**Recommendation:**
```typescript
useEffect(() => {
  if (!pathname) return;
  const query = searchParams.toString();  // Use .toString() which is stable
  // ... rest of logic
}, [activeLocale, pathname, router, query]);  // Use query string, not searchParams object
```

---

### 3. **Hook Usage Patterns** ✅
**Well-Implemented Examples:**

All of the following components properly implement hooks following best practices:

- [hooks/useMediaQuery.ts](hooks/useMediaQuery.ts) - Correct use of `useSyncExternalStore`
- [hooks/useOnlineStatus.ts](hooks/useOnlineStatus.ts) - Correct use of `useSyncExternalStore`
- [components/pages/PlanningPageClient.tsx](components/pages/PlanningPageClient.tsx#L115-L135) - Multiple hooks in correct order with stable dependency arrays
- [components/pages/SettingsPageClient.tsx](components/pages/SettingsPageClient.tsx#L25-L42) - Multiple hooks with proper dependencies
- [components/auth/LogoutButton.tsx](components/auth/LogoutButton.tsx#L54-L160) - Complex hook usage with proper cleanup and dependencies
- [components/deadlines/StatsCard.tsx](components/deadlines/StatsCard.tsx#L21-L27) - Correct `useMemo` implementation

---

## Hook Usage Audit Results

### Custom Hooks
✅ **hooks/useMediaQuery.ts**
- Uses `useSyncExternalStore` correctly
- No conditional calls
- Stable dependency handling

✅ **hooks/useOnlineStatus.ts**
- Uses `useSyncExternalStore` correctly
- No conditional calls
- Stable dependency handling

### Layout Components
✅ **app/layout.tsx** - Server component, no hooks
✅ **app/(app)/layout.tsx** - Server component, no hooks
✅ **app/[locale]/layout.tsx** - Server component, no hooks
✅ **app/[locale]/(app)/layout.tsx** - Server component, no hooks

### Page Components
✅ **app/(app)/page.tsx** - Server component, no hooks
✅ **app/[locale]/(app)/page.tsx** - Server component, no hooks
✅ **app/(app)/planning/page.tsx** - Server component, no hooks
✅ **app/(app)/deadlines/page.tsx** - Server component, no hooks
✅ **app/(app)/settings/page.tsx** - Server component, no hooks

### Client Components with Hooks
✅ **components/i18n/LocaleProvider.tsx**
- Hooks: `useState`, `useEffect` (3x), `useContext` (custom hook)
- Issue: See Concern #2 above
- Other patterns: All hooks unconditional

✅ **components/pages/PlanningPageClient.tsx**
- Hooks: `useAppLocale`, `useMessages`, `useRef` (7x), `useState` (4x), `useEffect` (5x), `useTransition`
- Patterns: All hooks called unconditionally at component top
- Dependencies: Well-managed

✅ **components/pages/SettingsPageClient.tsx**
- Hooks: Multiple state, effects, transitions
- Patterns: All hooks unconditional
- Dependencies: Well-managed

⚠️ **components/planning/CustomSubjectModal.tsx**
- Hooks: `useState` (2x)
- Issue: See Concern #1 above
- Risk: Low - Still technically follows rules

✅ **components/auth/LogoutButton.tsx**
- Hooks: `useCallback` (2x), `useEffect`, `useRef` (5x)
- Patterns: All hooks unconditional
- Dependencies: Complex but correct

✅ **components/auth/LoginPanel.tsx**
- Hooks: `useEffect`, `useState` (2x)
- Patterns: All hooks unconditional
- Dependencies: Good

✅ **components/layout/TopbarProfileMenu.tsx**
- Hooks: `useAppLocale`, `useMessages`, `usePathname`, `useState`, `useRef` (2x), `useEffect`
- Patterns: All hooks unconditional
- Dependencies: Good

⚠️ **components/layout/OnlineStatusBanner.tsx**
- Hooks: `useMessages`, `useOnlineStatus`
- Issue: See Concern #1 above
- Pattern: Conditional return after hooks (minor concern)
- Risk: Low - Returns null safely

✅ **components/deadlines/StatsCard.tsx**
- Hooks: `useState`, `useMemo` (2x)
- Patterns: All hooks unconditional
- Dependencies: Properly configured

✅ **components/deadlines/DeadlinesList.tsx**
- Hooks: `useState`
- Patterns: Hook unconditional
- Dependencies: N/A for useState

✅ **components/layout/BottomNav.tsx**
- Hooks: `useAppLocale`, `useMessages`, `usePathname`, `useMediaQuery`
- Patterns: All hooks unconditional
- Conditional rendering: Uses hook result for rendering logic (correct pattern)

✅ **components/layout/SettingsLink.tsx**
- Hooks: `useAppLocale`, `usePathname`
- Patterns: Unconditional
- Dependencies: Good

✅ **components/layout/SlotBubble.tsx**
- Hooks: `useMessages`, `useSyncExternalStore`
- Patterns: All hooks unconditional
- Dependencies: Good

---

## Dependency Array Analysis

### Checked for Stability
- ✅ Most dependency arrays contain primitives or stable references
- ✅ Context values properly tracked
- ⚠️ **LocaleProvider**: `searchParams` object may not be stable (see Concern #2)

### Checked for Completeness
- ✅ All used variables are included in dependencies
- ✅ No "stale closure" issues detected
- ✅ useCallback dependencies properly configured

---

## Recommendations

### High Priority
1. **Fix CustomSubjectModal pattern** - Move early return before hooks to align with React best practices

### Medium Priority
2. **Optimize LocaleProvider dependencies** - Change `searchParams` to `query` variable in dependency array to prevent unnecessary effect runs

### Low Priority
3. **Consider OnlineStatusBanner pattern** - While safe, consider if the early return should happen before hooks are called

---

## Conclusion
The codebase demonstrates good understanding of React's Rules of Hooks with only minor patterns to improve. No critical issues that would cause runtime errors or unpredictable behavior were found.

**Overall Assessment:** ✅ **GOOD - Minor improvements recommended**
