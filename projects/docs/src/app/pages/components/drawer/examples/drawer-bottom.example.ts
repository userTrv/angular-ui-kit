import { ChangeDetectionStrategy, Component, TemplateRef, inject, signal, viewChild } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';
import { UiDialogClose, UiDialogContent, UiDialogTemplateContext, UiDialogTitle } from '@usertrv/ui/dialog';
import { UiDrawer } from '@usertrv/ui/drawer';

type ShareTarget = 'link' | 'email' | 'pdf';

@Component({
  selector: 'docs-drawer-bottom-example',
  imports: [UiButton, UiDialogTitle, UiDialogContent, UiDialogClose],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-row">
      <button uiButton (click)="share()">Share invoice</button>
      <span class="docs-muted" aria-live="polite">{{ status() }}</span>
    </div>

    <ng-template #sheet>
      <h2 uiDialogTitle>Share INV-2041</h2>
      <div uiDialogContent class="docs-stack">
        <button uiButton block [uiDialogClose]="'link'">Copy link</button>
        <button uiButton block [uiDialogClose]="'email'">Send by email</button>
        <button uiButton block [uiDialogClose]="'pdf'">Download PDF</button>
      </div>
    </ng-template>
  `,
})
export class DrawerBottomExample {
  private readonly drawer = inject(UiDrawer);
  private readonly sheet = viewChild.required<TemplateRef<UiDialogTemplateContext<void, ShareTarget>>>('sheet');
  protected readonly status = signal('');

  protected async share(): Promise<void> {
    const target = await this.drawer.open<ShareTarget>(this.sheet(), { position: 'bottom' }).result;
    const messages: Record<ShareTarget, string> = {
      link: 'Link copied.',
      email: 'Email draft opened.',
      pdf: 'PDF downloaded.',
    };
    this.status.set(target ? messages[target] : '');
  }
}
