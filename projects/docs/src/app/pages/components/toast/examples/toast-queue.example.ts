import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';
import { UiToast } from '@usertrv/ui/toast';

@Component({
  selector: 'docs-toast-queue-example',
  imports: [UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-row">
      <button uiButton (click)="upload()">Upload 6 files</button>
      <button uiButton variant="ghost" (click)="toast.dismissAll()">Dismiss all</button>
      <span class="docs-muted">Waiting in queue: {{ toast.queued() }}</span>
    </div>
  `,
})
export class ToastQueueExample {
  protected readonly toast = inject(UiToast);

  protected upload(): void {
    const files = ['brief.pdf', 'logo.svg', 'hero.png', 'budget.xlsx', 'notes.md', 'contract.docx'];
    for (const file of files) {
      this.toast.show({ title: 'Upload complete', message: file, variant: 'success', duration: 4000 });
    }
  }
}
