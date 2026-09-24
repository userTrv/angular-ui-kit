import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';
import { UiToast } from '@usertrv/ui/toast';

@Component({
  selector: 'docs-toast-undo-example',
  imports: [UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="docs-stack">
      @for (task of tasks(); track task) {
        <li class="docs-row">
          <span>{{ task }}</span>
          <button uiButton size="sm" variant="ghost" [attr.aria-label]="'Archive ' + task" (click)="archive(task)">Archive</button>
        </li>
      } @empty {
        <li class="docs-muted">All tasks archived.</li>
      }
    </ul>
  `,
  styles: `ul { list-style: none; margin: 0; padding: 0; }`,
})
export class ToastUndoExample {
  private readonly toast = inject(UiToast);
  protected readonly tasks = signal(['Draft Q3 roadmap', 'Review onboarding copy', 'Update pricing page']);

  protected archive(task: string): void {
    const before = this.tasks();
    this.tasks.set(before.filter((t) => t !== task));
    this.toast.show({
      title: 'Task archived',
      message: `“${task}”`,
      action: { label: 'Undo', handler: () => this.tasks.set(before) },
    });
  }
}
