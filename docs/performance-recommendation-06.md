# 6 — External CSS

Changed `experimental.inlineCss` from `true` to `false`. React Compiler and all other Next options are unchanged.

This implements the requested trade-off: stylesheets can be cached independently on repeat visits, with extra stylesheet requests on cold entry. The earlier report's public-route body measurements motivated the decision; they do not establish a paint-time improvement. No new FCP/LCP or authenticated-route speedup is claimed for this one-line change.

Validation: Prettier applied; the final frontend production build checks the configuration. No backend deployment is required for this option.
