import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';
import { UiMenu, UiMenuItem, UiMenuSeparator, UiMenuTrigger } from '@usertrv/ui/menu';

@Component({
  selector: 'docs-menu-nested-example',
  imports: [UiButton, UiMenu, UiMenuItem, UiMenuSeparator, UiMenuTrigger],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-row">
      <button uiButton variant="ghost" [uiMenuTriggerFor]="file">File</button>
      <span class="docs-muted" aria-live="polite">{{ status() }}</span>
    </div>

    <ng-template #file>
      <ui-menu>
        <button uiMenuItem (triggered)="status.set('New document created')">New document</button>
        <button uiMenuItem [uiMenuTriggerFor]="recent">Open recent</button>
        <button uiMenuItem [uiMenuTriggerFor]="share">Share</button>
        <ui-menu-separator />
        <button uiMenuItem (triggered)="status.set('Exported as PDF')">Export as PDF</button>
      </ui-menu>
    </ng-template>

    <ng-template #recent>
      <ui-menu>
        @for (doc of recentDocs; track doc) {
          <button uiMenuItem (triggered)="status.set('Opened ' + doc)">{{ doc }}</button>
        }
      </ui-menu>
    </ng-template>

    <ng-template #share>
      <ui-menu>
        <button uiMenuItem (triggered)="status.set('Link copied')">Copy link</button>
        <button uiMenuItem [uiMenuTriggerFor]="invite">Invite</button>
      </ui-menu>
    </ng-template>

    <ng-template #invite>
      <ui-menu>
        <button uiMenuItem (triggered)="status.set('Invited the design team')">Design team</button>
        <button uiMenuItem (triggered)="status.set('Invited engineering')">Engineering</button>
      </ui-menu>
    </ng-template>
  `,
})
export class MenuNestedExample {
  protected readonly status = signal('');
  protected readonly recentDocs = ['Roadmap 2027.md', 'Release notes 0.4.md', 'Hiring plan.md'];
}
