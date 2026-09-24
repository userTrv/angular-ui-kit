import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';
import { UiPopover, UiPopoverClose, UiPopoverTrigger } from '@usertrv/ui/popover';

@Component({
  selector: 'docs-popover-profile-example',
  imports: [UiButton, UiPopover, UiPopoverTrigger, UiPopoverClose],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-row">
      <span>Assigned to</span>
      <button uiButton variant="ghost" [uiPopoverTrigger]="profile" uiPopoverPosition="end" uiPopoverAutoFocus="panel">
        Maria Chen
      </button>
      <span class="docs-muted" aria-live="polite">{{ status() }}</span>
    </div>

    <ng-template uiPopover #profile="uiPopover" uiPopoverLabelledBy="profile-name">
      <div class="docs-stack">
        <div>
          <strong id="profile-name">Maria Chen</strong>
          <div class="docs-muted">Product designer · Berlin (UTC+2)</div>
        </div>
        <p>Working on the checkout redesign. Usually replies within an hour.</p>
        <div class="docs-row">
          <button uiButton size="sm" uiPopoverClose (click)="status.set('Message draft to Maria opened.')">Message</button>
          <button uiButton size="sm" variant="ghost" uiPopoverClose (click)="status.set('Task unassigned.')">Unassign</button>
        </div>
      </div>
    </ng-template>
  `,
})
export class PopoverProfileExample {
  protected readonly status = signal('');
}
