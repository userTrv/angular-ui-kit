import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiBadge, UiBadgeVariant } from '@usertrv/ui/badge';

@Component({
  selector: 'docs-badge-variants-example',
  imports: [UiBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-stack">
      <div class="docs-row">
        @for (status of statuses; track status.label) {
          <ui-badge [variant]="status.variant" dot>{{ status.label }}</ui-badge>
        }
      </div>
      <div class="docs-row">
        @for (status of statuses; track status.label) {
          <ui-badge [variant]="status.variant" appearance="solid">{{ status.label }}</ui-badge>
        }
      </div>
      <div class="docs-row">
        <ui-badge size="sm" variant="primary">Beta</ui-badge>
        <ui-badge size="sm">v0.4.1</ui-badge>
        <ui-badge size="sm" variant="danger" appearance="solid">12<span class="ui-sr-only"> failed checks</span></ui-badge>
      </div>
    </div>
  `,
})
export class BadgeVariantsExample {
  protected readonly statuses: { label: string; variant: UiBadgeVariant }[] = [
    { label: 'Draft', variant: 'neutral' },
    { label: 'In review', variant: 'primary' },
    { label: 'Paid', variant: 'success' },
    { label: 'Overdue', variant: 'warning' },
    { label: 'Failed', variant: 'danger' },
    { label: 'Scheduled', variant: 'info' },
  ];
}
