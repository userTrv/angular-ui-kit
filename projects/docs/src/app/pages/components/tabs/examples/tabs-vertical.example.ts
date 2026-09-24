import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiTab, UiTabGroup } from '@usertrv/ui/tabs';

@Component({
  selector: 'docs-tabs-vertical-example',
  imports: [UiTabGroup, UiTab],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-tab-group aria-label="Account settings" orientation="vertical">
      <ui-tab label="Profile">
        <p>Name, photo and the public email shown on your commits.</p>
      </ui-tab>
      <ui-tab label="Notifications">
        <p>Email me when someone mentions me or requests my review.</p>
      </ui-tab>
      <ui-tab label="Security">
        <p>Two-factor authentication is on. 2 active sessions.</p>
      </ui-tab>
    </ui-tab-group>
  `,
})
export class TabsVerticalExample {}
