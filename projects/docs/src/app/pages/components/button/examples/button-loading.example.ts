import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';

@Component({
  selector: 'docs-button-loading-example',
  imports: [UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-row">
      <button uiButton variant="primary" [loading]="saving()" (click)="save()">Save changes</button>
      <span class="docs-muted" aria-live="polite">{{ saving() ? 'Saving…' : saved() ? 'Saved' : '' }}</span>
    </div>
  `,
})
export class ButtonLoadingExample {
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);

  protected save(): void {
    this.saving.set(true);
    this.saved.set(false);
    setTimeout(() => {
      this.saving.set(false);
      this.saved.set(true);
    }, 1500);
  }
}
