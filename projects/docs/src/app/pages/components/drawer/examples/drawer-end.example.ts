import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';
import { UiDialogActions, UiDialogContent, UiDialogRef, UiDialogTitle } from '@usertrv/ui/dialog';
import { UiDrawer } from '@usertrv/ui/drawer';

const STATUSES = ['Backlog', 'In progress', 'In review', 'Done'] as const;

@Component({
  selector: 'docs-filters-drawer',
  imports: [UiButton, UiDialogTitle, UiDialogContent, UiDialogActions],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 uiDialogTitle>Filter tasks</h2>
    <div uiDialogContent>
      <fieldset class="docs-stack">
        <legend class="docs-muted">Status</legend>
        @for (status of statuses; track status) {
          <label>
            <input type="checkbox" [checked]="selected().has(status)" (change)="toggle(status)" />
            {{ status }}
          </label>
        }
      </fieldset>
    </div>
    <div uiDialogActions align="between">
      <button uiButton variant="ghost" (click)="clear()">Clear</button>
      <button uiButton variant="primary" (click)="apply()">Show results</button>
    </div>
  `,
  styles: `fieldset { border: 0; margin: 0; padding: 0; }`,
})
class FiltersDrawer {
  private readonly ref = inject<UiDialogRef<string[]>>(UiDialogRef);
  protected readonly statuses = STATUSES;
  protected readonly selected = signal(new Set<string>(['In progress']));

  protected toggle(status: string): void {
    this.selected.update((current) => {
      const next = new Set(current);
      if (!next.delete(status)) next.add(status);
      return next;
    });
  }

  protected clear(): void {
    this.selected.set(new Set());
  }

  protected apply(): void {
    this.ref.close([...this.selected()]);
  }
}

@Component({
  selector: 'docs-drawer-end-example',
  imports: [UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-row">
      <button uiButton (click)="openFilters()">Filters</button>
      <span class="docs-muted" aria-live="polite">{{ summary() }}</span>
    </div>
  `,
})
export class DrawerEndExample {
  private readonly drawer = inject(UiDrawer);
  protected readonly summary = signal('Showing: In progress');

  protected async openFilters(): Promise<void> {
    const statuses = await this.drawer.open<string[]>(FiltersDrawer).result;
    if (statuses) this.summary.set(statuses.length ? `Showing: ${statuses.join(', ')}` : 'Showing all tasks');
  }
}
