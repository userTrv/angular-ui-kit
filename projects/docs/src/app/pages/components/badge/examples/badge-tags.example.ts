import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { UiBadge, UiTag } from '@usertrv/ui/badge';
import { UiButton } from '@usertrv/ui/button';

const INITIAL_FILTERS = ['Status: Open', 'Assignee: Kirill', 'Label: a11y', 'Milestone: 0.5'];

@Component({
  selector: 'docs-badge-tags-example',
  imports: [UiBadge, UiTag, UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-stack">
      <ul class="tags" aria-label="Active filters">
        @for (filter of filters(); track filter; let i = $index) {
          <li>
            <ui-tag removable variant="primary" (removed)="remove(i)">{{ filter }}</ui-tag>
          </li>
        }
        <li><ui-tag>Archived excluded</ui-tag></li>
      </ul>
      <div class="docs-row">
        <button uiButton size="sm" (click)="filters.set(initialFilters)">Reset filters</button>
        <ui-badge size="sm">{{ filters().length }} active</ui-badge>
      </div>
    </div>
  `,
  styles: `
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
  `,
})
export class BadgeTagsExample {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  protected readonly initialFilters = INITIAL_FILTERS;
  protected readonly filters = signal(INITIAL_FILTERS);

  protected remove(index: number): void {
    this.filters.update((list) => list.filter((_, i) => i !== index));
    // The removed tag took focus with it: move focus to the tag that took its place
    // (or the last one), or to the reset button when no removable tag is left.
    afterNextRender(
      () => {
        const removeButtons = this.host.querySelectorAll<HTMLButtonElement>('.ui-tag__remove');
        const target = removeButtons[Math.min(index, removeButtons.length - 1)];
        (target ?? this.host.querySelector<HTMLButtonElement>('button[uiButton]'))?.focus();
      },
      { injector: this.injector },
    );
  }
}
