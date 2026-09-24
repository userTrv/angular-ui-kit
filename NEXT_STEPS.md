# Next steps (work in progress)

Status: all 21 components + headless layers (a11y, listbox, forms) are implemented with specs and docs
pages (component agents reported: forms 40, select/combobox 73, datepicker 60, overlays 53,
navigation/display 84, table 61 tests, plus core + docs axe suite). The coordinator has NOT yet
re-run the full suite on the merged tree.

## Verification not yet done
- [ ] Full `pnpm install --frozen-lockfile && pnpm lint && pnpm test && pnpm build` on the merged tree.
- [ ] `pnpm test:a11y` (Playwright + axe, 3 themes) on all pages — last run had only 3 pages and found
      Shiki contrast + skip-link `region` issues; both fixed (github-*-default themes, skip link moved
      into <header>) but not re-verified.
- [ ] Browser walk-through from a sub-path copy of dist (`<tmp>/x/projects/angular-ui-kit/`, port 8943),
      keyboard-only per component, console clean, 375 px width, dark + high-contrast themes.
- [ ] README screenshots in `docs/` (< 500 KB each).
- [ ] Check CI step `pnpm exec playwright-core install --with-deps chromium` actually works.

## Unfinished / follow-ups reported by component agents
- [ ] README.md: full write-up (pitch, live link https://usertrv.dev/projects/angular-ui-kit/, features,
      architecture, trade-offs, measured numbers from `pnpm size` and test counts, limitations,
      "not on npm yet"). Currently a placeholder.
- [ ] gen-docs.mjs: `firstTypeArg` cuts function types at `=>` (e.g. `(a: T) =`); ignores inputs/outputs
      exposed via `hostDirectives` (menu API tables incomplete); `findApi` only looks in the page's own
      entry point (listbox has no API table — add a listbox docs page or cross-entry lookup).
- [ ] Move `injectUiControlState()` from `@usertrv/ui/form-field` to `@usertrv/ui/forms`.
- [ ] `ui-select`, `ui-combobox`, `ui-datepicker` do not provide `UI_FORM_FIELD_CONTROL` yet
      (cannot sit inside `ui-form-field`).
- [ ] `projects/ui/styles/base.css` uses `--ui-line-height-normal`; real token is `--ui-font-line-height-normal`.
- [ ] `badge.css` uses nonexistent `--ui-space-2-5` (fallback applies) — add token or fix value.
- [ ] Optional tokens proposed: `--ui-calendar-cell-size`, `--ui-dialog-width-sm/md/lg`.
- [ ] `combobox.ts` (318 lines) and `table.ts` (302) slightly over the ~300-line guideline.
- [ ] Docs shell: replace native theme `<select>` with `ui-select` (dogfooding); mobile nav should close on
      Escape; home "Architecture" text says the token script is "90-line" — verify.
- [ ] Changesets: no pnpm workspace yet, so `changeset` only sees the private root package; add
      `pnpm-workspace.yaml` with `projects/ui` (update lockfile) or document manual versioning.
- [ ] Final report: tree, component list, test counts (incl. axe), `pnpm size` per entry point,
      limitations, `git log --oneline`.
