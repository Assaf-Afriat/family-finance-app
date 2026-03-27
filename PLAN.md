# Family Finance App - MVP Status

## Completed in this pass

- Fixed all TypeScript errors and restored a clean `npx tsc --noEmit`
- Unified renderer/preload contracts through `src/types` and `src/vite-env.d.ts`
- Added missing category CRUD IPC and preload methods
- Enforced active-profile data scoping for transactions, accounts, reports, recurring data, and related refresh flows
- Made transaction and recurring forms use managed categories instead of only hardcoded lists
- Fixed dev database bootstrap so `db:push` and `db:seed` target the same SQLite file
- Produced a working portable Windows build in `release-build/`
- Verified the packaged executable launches

## Verified Commands

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npx tsc --noEmit
npm run build
```

## Current Release Output

- Portable executable: `release-build/Family Finance 1.0.0.exe`
- Unpacked app: `release-build/win-unpacked/`

## Current Known Gaps

- No automated tests yet
- Browser-only mode is still dev-only and not feature-complete
- Build uses `asar: false`
- Packaged app still uses the default Electron icon
- Renderer bundle is large and should be split later

## Security Notes

- Direct production `jspdf` critical issue was removed
- Remaining production advisories are transitive (`dompurify`, `picomatch`) and should be handled in a future dependency-hardening pass

## Next Recommended Work

1. Add unit and end-to-end tests for profile isolation and core CRUD flows.
2. Add release polish: icon, metadata, and installer-quality packaging settings.
3. Reduce bundle size with code splitting.
4. Review remaining dependency advisories and major-version upgrade path for Electron/Vite/electron-builder.
