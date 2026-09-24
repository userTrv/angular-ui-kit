import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiTab, UiTabContent, UiTabGroup } from '@usertrv/ui/tabs';

@Component({
  selector: 'docs-tabs-activity-log',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul>
      @for (entry of entries; track entry) {
        <li>{{ entry }}</li>
      }
    </ul>
    <p class="docs-muted">Rendered at {{ renderedAt }}</p>
  `,
})
export class TabsActivityLog {
  protected readonly renderedAt = new Date().toLocaleTimeString();
  protected readonly entries = ['Deployed v0.4.1 to production', 'Merged “Add pagination”', 'Rotated API keys'];
}

@Component({
  selector: 'docs-tabs-lazy-example',
  imports: [UiTabGroup, UiTab, UiTabContent, TabsActivityLog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-tab-group aria-label="Project">
      <ui-tab label="Summary"><p>The activity log is only created when you open its tab.</p></ui-tab>
      <ui-tab label="Activity">
        <ng-template uiTabContent><docs-tabs-activity-log /></ng-template>
      </ui-tab>
    </ui-tab-group>
  `,
})
export class TabsLazyExample {}
