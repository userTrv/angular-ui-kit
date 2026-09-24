import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiTab, UiTabGroup, UiTabLabel } from '@usertrv/ui/tabs';

@Component({
  selector: 'docs-tabs-automatic-example',
  imports: [UiTabGroup, UiTab, UiTabLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-tab-group aria-label="Repository" [(selectedIndex)]="selected">
      <ui-tab label="Overview">
        <p>angular-ui-kit — accessible Angular components on top of the CDK.</p>
      </ui-tab>
      <ui-tab>
        <ng-template uiTabLabel>Pull requests <span class="docs-muted">(4)</span></ng-template>
        <p>4 open pull requests, 2 waiting for review.</p>
      </ui-tab>
      <ui-tab label="Insights" disabled>
        <p>Insights are available on paid plans.</p>
      </ui-tab>
      <ui-tab label="Settings">
        <p>Default branch: <code>main</code>. Squash merging only.</p>
      </ui-tab>
    </ui-tab-group>
    <p class="docs-muted">Selected index: {{ selected() }}</p>
  `,
})
export class TabsAutomaticExample {
  protected readonly selected = signal(0);
}
