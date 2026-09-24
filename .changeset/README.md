# Changesets

Versioning for `@usertrv/ui` (projects/ui) is managed with [Changesets](https://github.com/changesets/changesets).
Nothing is published yet; the flow below is what a release will look like.

1. With a user-facing change, run `pnpm changeset`, pick the bump (patch / minor / major) and describe it.
2. `pnpm version-packages` applies pending changesets: bumps `projects/ui/package.json` and writes `CHANGELOG.md`.
3. `pnpm build:lib && cd dist-lib/ui && npm publish` (not done yet — see the README).

A change to `projects/ui/public-api.golden.md` without a changeset should be treated as a review blocker.
