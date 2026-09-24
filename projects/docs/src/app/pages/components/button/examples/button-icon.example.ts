import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';

@Component({
  selector: 'docs-button-icon-example',
  imports: [UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-row">
      <button uiButton variant="primary">
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 4a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H5a1 1 0 1 1 0-2h4V5a1 1 0 0 1 1-1Z" /></svg>
        New project
      </button>
      <button uiIconButton aria-label="Edit">
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M13.6 3.4a2 2 0 0 1 2.8 2.8l-8.5 8.5-3.6.8.8-3.6 8.5-8.5Z" /></svg>
      </button>
      <button uiIconButton variant="ghost" aria-label="Delete">
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M8 3h4a1 1 0 0 1 1 1v1h3a1 1 0 1 1 0 2h-1l-.8 9.1A2 2 0 0 1 12.2 18H7.8a2 2 0 0 1-2-1.9L5 7H4a1 1 0 0 1 0-2h3V4a1 1 0 0 1 1-1Z" /></svg>
      </button>
    </div>
  `,
})
export class ButtonIconExample {}
