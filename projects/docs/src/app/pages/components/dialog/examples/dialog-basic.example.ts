import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';
import {
  UiDialog,
  UiDialogActions,
  UiDialogClose,
  UiDialogContent,
  UiDialogSize,
  UiDialogTitle,
} from '@usertrv/ui/dialog';

@Component({
  selector: 'docs-release-notes-dialog',
  imports: [UiButton, UiDialogTitle, UiDialogContent, UiDialogActions, UiDialogClose],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 uiDialogTitle>What’s new in version 2.4</h2>
    <div uiDialogContent>
      <p>Boards load up to three times faster on large workspaces, and a few long-standing requests are in:</p>
      <ul>
        <li>Recurring tasks: daily, weekly or on a custom schedule.</li>
        <li>Saved filters are shared with everyone in the project.</li>
        <li>CSV export includes custom fields.</li>
      </ul>
    </div>
    <div uiDialogActions>
      <button uiButton variant="primary" uiDialogClose>Got it</button>
    </div>
  `,
})
class ReleaseNotesDialog {}

@Component({
  selector: 'docs-dialog-basic-example',
  imports: [UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-row">
      <button uiButton variant="primary" (click)="open('md')">Release notes</button>
      <button uiButton (click)="open('sm')">Small</button>
      <button uiButton (click)="open('lg')">Large</button>
    </div>
  `,
})
export class DialogBasicExample {
  private readonly dialog = inject(UiDialog);

  protected open(size: UiDialogSize): void {
    this.dialog.open(ReleaseNotesDialog, { size });
  }
}
