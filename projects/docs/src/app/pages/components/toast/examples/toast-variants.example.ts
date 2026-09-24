import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';
import { UiToast } from '@usertrv/ui/toast';

@Component({
  selector: 'docs-toast-variants-example',
  imports: [UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-row">
      <button uiButton (click)="info()">Info</button>
      <button uiButton (click)="success()">Success</button>
      <button uiButton (click)="warning()">Warning</button>
      <button uiButton (click)="danger()">Danger</button>
    </div>
  `,
})
export class ToastVariantsExample {
  private readonly toast = inject(UiToast);

  protected info(): void {
    this.toast.show({ title: 'Maintenance on Sunday', message: 'Sync is paused from 02:00 to 03:00 UTC.' });
  }

  protected success(): void {
    this.toast.show({ title: 'Invoice sent', message: 'INV-2041 was emailed to billing@acme.io.', variant: 'success' });
  }

  protected warning(): void {
    this.toast.show({ title: 'Storage almost full', message: 'You have used 9.2 of 10 GB.', variant: 'warning' });
  }

  protected danger(): void {
    this.toast.show({
      title: 'Payment failed',
      message: 'The card ending in 4242 was declined.',
      variant: 'danger',
      duration: 0,
    });
  }
}
