# Changelog

Every change to the app ships as a new version. The version comes from `package.json`
(`0.1.0` is shown in the app as **V0.1**). Bump the minor number for each change
(`0.2.0` → V0.2, `0.3.0` → V0.3, …) and tag the commit (`v0.2`, `v0.3`, …).

## V0.1 — 2026-11-20
- The app version is shown in the header and footer.
- Both segments and complete programs refresh every time the app opens, and again
  when you return to it after more than a minute in the background. These refreshes
  run in the background, so audio that is playing keeps playing.
- The refresh button reloads both lists.
- Server-side cache of the 103FM sources reduced from 5 minutes to 1 minute.
