"use client";

import { useEffect } from "react";
import { applyTheme } from "@/lib/settings/client";
import type { AppTheme } from "@/lib/settings/types";

type ThemeRootSyncProps = {
  theme: AppTheme;
};

export default function ThemeRootSync({ theme }: ThemeRootSyncProps) {
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return null;
}
