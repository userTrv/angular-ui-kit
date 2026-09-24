# @usertrv/ui

Headless-first Angular UI kit built on Angular CDK: design tokens with light, dark and high-contrast
themes, accessible components with full keyboard support, Signal Forms and Reactive Forms integration.
Every component ships from its own secondary entry point (`@usertrv/ui/select`, `@usertrv/ui/dialog`, …).

Documentation and live examples: https://usertrv.dev/projects/angular-ui-kit/

> Not published to npm yet. Build it from the repository (`pnpm build:lib`) and install the packed tarball.

```jsonc
// angular.json → styles
["node_modules/@angular/cdk/overlay-prebuilt.css", "node_modules/@usertrv/ui/styles/ui.css"]
```

```ts
import { UiButton } from '@usertrv/ui/button';
import { UiSelect, UiSelectOption } from '@usertrv/ui/select';
```

Peer dependencies: `@angular/core`, `@angular/common`, `@angular/forms`, `@angular/cdk` (^22.2).
License: MIT.
