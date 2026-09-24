import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';
import { UiPopover, UiPopoverClose, UiPopoverTrigger } from '@usertrv/ui/popover';

const LABELS = ['Bug', 'Feature', 'Design', 'Documentation'];

@Component({
  selector: 'docs-popover-filter-example',
  imports: [UiButton, UiPopover, UiPopoverTrigger, UiPopoverClose],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-row">
      <button uiButton [uiPopoverTrigger]="filter">
        Labels
        @if (count()) {
          <span class="docs-muted">({{ count() }})</span>
        }
      </button>
      <span class="docs-muted" aria-live="polite">{{ summary() }}</span>
    </div>

    <ng-template uiPopover #filter="uiPopover" uiPopoverLabelledBy="label-filter-title">
      <div class="docs-stack">
        <strong id="label-filter-title">Filter by label</strong>
        @for (label of labels; track label) {
          <label>
            <input type="checkbox" [checked]="selected().includes(label)" (change)="toggle(label)" />
            {{ label }}
          </label>
        }
        <div class="docs-row">
          <button uiButton size="sm" variant="ghost" (click)="selected.set([])">Clear</button>
          <button uiButton size="sm" variant="primary" uiPopoverClose>Done</button>
        </div>
      </div>
    </ng-template>
  `,
})
export class PopoverFilterExample {
  protected readonly labels = LABELS;
  protected readonly selected = signal<string[]>(['Bug']);
  protected readonly count = computed(() => this.selected().length);
  protected readonly summary = computed(() =>
    this.count() ? `Showing issues labelled ${this.selected().join(' or ')}` : 'Showing all issues',
  );

  protected toggle(label: string): void {
    this.selected.update((list) => (list.includes(label) ? list.filter((l) => l !== label) : [...list, label]));
  }
}
