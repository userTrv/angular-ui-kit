import { ChangeDetectionStrategy, Component, ElementRef, Injector, afterNextRender, inject, signal, viewChild } from '@angular/core';
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
    @if (tasks().length < initialTasks.length) {
      <button #restoreBtn uiButton size="sm" class="restore" (click)="restoreTasks()">Restore all tasks</button>
    }
  `,
  styles: `ul { list-style: none; margin: 0; padding: 0; } .restore { margin-top: var(--ui-space-3); }`,
})
export class ToastUndoExample {
  private readonly toast = inject(UiToast);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly restoreButton = viewChild('restoreBtn', { read: ElementRef<HTMLButtonElement> });
  protected readonly initialTasks = ['Draft Q3 roadmap', 'Review onboarding copy', 'Update pricing page'];
  protected readonly tasks = signal(this.initialTasks);

  protected restoreTasks(): void {
    this.tasks.set(this.initialTasks);
    afterNextRender(() => this.host.querySelector<HTMLButtonElement>('li button')?.focus(), { injector: this.injector });
  }

  protected archive(task: string): void {
    const before = this.tasks();
    const index = before.indexOf(task);
    this.tasks.set(before.filter((t) => t !== task));
    // The pressed button is gone: move focus to the next task (or the restore button), not to <body>.
    afterNextRender(
      () => {
        const buttons = this.host.querySelectorAll<HTMLButtonElement>('li button');
        (buttons[Math.min(index, buttons.length - 1)] ?? this.restoreButton()?.nativeElement)?.focus();
      },
      { injector: this.injector },
    );
    this.toast.show({
      title: 'Task archived',
      message: `“${task}”`,
      action: { label: 'Undo', handler: () => this.tasks.set(before) },
    });
  }
}
