import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiSelect, UiSelectOption } from '@usertrv/ui/select';

@Component({
  selector: 'docs-select-multiple-example',
  imports: [UiSelect, UiSelectOption],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .label {
      display: block;
      margin-bottom: var(--ui-space-1-5);
      font-size: var(--ui-font-size-sm);
      font-weight: var(--ui-font-weight-medium);
    }
  `,
  template: `
    <div class="docs-stack">
      <div>
        <span class="label" id="labels-label">Issue labels</span>
        <ui-select aria-labelledby="labels-label" placeholder="Add labels" multiple [(value)]="labels">
          @for (label of available; track label) {
            <ui-option [value]="label">{{ label }}</ui-option>
          }
        </ui-select>
      </div>
      <p class="docs-muted">Value: {{ labels().join(', ') || 'none' }}</p>
    </div>
  `,
})
export class SelectMultipleExample {
  protected readonly available = ['bug', 'documentation', 'performance', 'accessibility', 'good first issue'];
  protected readonly labels = signal<readonly string[]>(['bug', 'accessibility']);
}
