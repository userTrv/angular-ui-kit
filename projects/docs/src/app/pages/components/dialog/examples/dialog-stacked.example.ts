import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';
import {
  UiDialog,
  UiDialogActions,
  UiDialogClose,
  UiDialogContent,
  UiDialogTitle,
} from '@usertrv/ui/dialog';

interface Member {
  name: string;
  role: 'Owner' | 'Editor' | 'Viewer';
}

@Component({
  selector: 'docs-share-dialog',
  imports: [UiButton, UiDialogTitle, UiDialogContent, UiDialogActions, UiDialogClose],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 uiDialogTitle>Share “Q3 planning”</h2>
    <ul uiDialogContent class="docs-stack">
      @for (member of members(); track member.name) {
        <li class="docs-row">
          <span>{{ member.name }} · <span class="docs-muted">{{ member.role }}</span></span>
          @if (member.role !== 'Owner') {
            <button uiButton size="sm" variant="ghost" (click)="remove(member)">Remove</button>
          }
        </li>
      }
    </ul>
    <div uiDialogActions>
      <button uiButton variant="primary" uiDialogClose>Done</button>
    </div>
  `,
  styles: `ul { list-style: none; margin: 0; }`,
})
class ShareDialog {
  private readonly dialog = inject(UiDialog);
  protected readonly members = signal<Member[]>([
    { name: 'Maria Chen', role: 'Owner' },
    { name: 'Ivan Petrov', role: 'Editor' },
    { name: 'Sara Okafor', role: 'Viewer' },
  ]);

  // A dialog opened from a dialog: Escape closes only the top one, and focus returns to "Remove".
  protected async remove(member: Member): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: `Remove ${member.name}?`,
      message: `${member.name} will lose access to “Q3 planning” and its files.`,
      confirmLabel: 'Remove',
      variant: 'danger',
    });
    if (confirmed) this.members.update((list) => list.filter((m) => m !== member));
  }
}

@Component({
  selector: 'docs-dialog-stacked-example',
  imports: [UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button uiButton (click)="open()">Share…</button>`,
})
export class DialogStackedExample {
  private readonly dialog = inject(UiDialog);

  protected open(): void {
    this.dialog.open(ShareDialog);
  }
}
