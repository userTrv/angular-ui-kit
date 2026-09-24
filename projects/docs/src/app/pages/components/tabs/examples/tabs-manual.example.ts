import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiTab, UiTabGroup } from '@usertrv/ui/tabs';

@Component({
  selector: 'docs-tabs-manual-example',
  imports: [UiTabGroup, UiTab],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-tab-group aria-label="Billing period" activation="manual">
      <ui-tab label="Monthly"><p>$12 per seat, billed every month. Cancel any time.</p></ui-tab>
      <ui-tab label="Yearly"><p>$120 per seat, billed once a year — two months free.</p></ui-tab>
      <ui-tab label="Enterprise"><p>Custom contracts, SSO and a dedicated support engineer.</p></ui-tab>
    </ui-tab-group>
  `,
})
export class TabsManualExample {}
