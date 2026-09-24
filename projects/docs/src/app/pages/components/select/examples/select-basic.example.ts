import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiSelect, UiSelectOption } from '@usertrv/ui/select';

@Component({
  selector: 'docs-select-basic-example',
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
        <span class="label" id="timezone-label">Time zone</span>
        <ui-select aria-labelledby="timezone-label" placeholder="Select a time zone" [(value)]="timezone">
          <ui-option value="America/Los_Angeles">Pacific Time — Los Angeles</ui-option>
          <ui-option value="America/New_York">Eastern Time — New York</ui-option>
          <ui-option value="Europe/London">Greenwich Mean Time — London</ui-option>
          <ui-option value="Europe/Berlin">Central European Time — Berlin</ui-option>
          <ui-option value="Asia/Dubai">Gulf Standard Time — Dubai</ui-option>
          <ui-option value="Asia/Tokyo">Japan Standard Time — Tokyo</ui-option>
        </ui-select>
      </div>
      <p class="docs-muted">Value: {{ timezone() ?? 'none' }}</p>
    </div>
  `,
})
export class SelectBasicExample {
  protected readonly timezone = signal<string | null>(null);
}
