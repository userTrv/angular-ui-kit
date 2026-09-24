import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';
import { UiDialog } from '@usertrv/ui/dialog';

@Component({
  selector: 'docs-dialog-confirm-example',
  imports: [UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-row">
      <button uiButton variant="danger" (click)="deleteProject()">Delete project</button>
      <span class="docs-muted" aria-live="polite">{{ status() }}</span>
    </div>
  `,
})
export class DialogConfirmExample {
  private readonly dialog = inject(UiDialog);
  protected readonly status = signal('');

  protected async deleteProject(): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'Delete “Website redesign”?',
      message: 'The project, its 48 tasks and all attachments will be deleted for everyone. This cannot be undone.',
      confirmLabel: 'Delete project',
      cancelLabel: 'Keep project',
      variant: 'danger',
    });
    this.status.set(confirmed ? 'Project deleted.' : 'Nothing was deleted.');
  }
}
