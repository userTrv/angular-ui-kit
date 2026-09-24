import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';
import {
  UiMenu,
  UiMenuItem,
  UiMenuItemIcon,
  UiMenuItemShortcut,
  UiMenuSeparator,
  UiMenuTrigger,
} from '@usertrv/ui/menu';

@Component({
  selector: 'docs-menu-basic-example',
  imports: [UiButton, UiMenu, UiMenuItem, UiMenuItemIcon, UiMenuItemShortcut, UiMenuSeparator, UiMenuTrigger],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-row">
      <button uiButton [uiMenuTriggerFor]="actions">
        Actions
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" /></svg>
      </button>
      <span class="docs-muted" aria-live="polite">{{ lastAction() }}</span>
    </div>

    <ng-template #actions>
      <ui-menu>
        <button uiMenuItem aria-keyshortcuts="Control+E" (triggered)="run('Renamed')">
          <svg uiMenuItemIcon viewBox="0 0 16 16" fill="currentColor"><path d="M11 2.3a1.5 1.5 0 0 1 2.1 0l.6.6a1.5 1.5 0 0 1 0 2.1L6.5 12.2l-3.2.7.7-3.2L11 2.3Z" /></svg>
          Rename
          <kbd uiMenuItemShortcut>Ctrl E</kbd>
        </button>
        <button uiMenuItem aria-keyshortcuts="Control+D" (triggered)="run('Duplicated')">
          <svg uiMenuItemIcon viewBox="0 0 16 16" fill="currentColor"><path d="M5 2h7a2 2 0 0 1 2 2v7h-2V4H5V2ZM2 6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6Z" /></svg>
          Duplicate
          <kbd uiMenuItemShortcut>Ctrl D</kbd>
        </button>
        <button uiMenuItem [disabled]="true">
          <svg uiMenuItemIcon viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v3H2V3Zm1 4h10v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Zm3 2v1h4V9H6Z" /></svg>
          Archive
        </button>
        <ui-menu-separator />
        <button uiMenuItem destructive (triggered)="run('Deleted')">
          <svg uiMenuItemIcon viewBox="0 0 16 16" fill="currentColor"><path d="M6 2h4a1 1 0 0 1 1 1v1h3v2h-1l-.7 7.1A1 1 0 0 1 11.3 14H4.7a1 1 0 0 1-1-.9L3 6H2V4h3V3a1 1 0 0 1 1-1Z" /></svg>
          Delete project
        </button>
      </ui-menu>
    </ng-template>
  `,
})
export class MenuBasicExample {
  protected readonly lastAction = signal('');

  protected run(action: string): void {
    this.lastAction.set(`${action} “Quarterly report”`);
  }
}
