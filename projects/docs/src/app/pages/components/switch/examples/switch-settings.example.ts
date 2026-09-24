import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiSwitch } from '@usertrv/ui/switch';

@Component({
  selector: 'docs-switch-settings-example',
  imports: [UiSwitch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-stack">
      <ui-switch [(checked)]="autoUpdates" description="Installs security patches overnight.">
        Automatic updates
      </ui-switch>
      <ui-switch [(checked)]="betaFeatures" description="New features before general availability. May be unstable.">
        Beta features
      </ui-switch>
      <ui-switch [checked]="true" disabled description="Managed by your administrator.">Audit log</ui-switch>
      <p class="docs-muted" aria-live="polite">
        Updates {{ autoUpdates() ? 'on' : 'off' }}, beta {{ betaFeatures() ? 'on' : 'off' }}
      </p>
    </div>
  `,
})
export class SwitchSettingsExample {
  protected readonly autoUpdates = signal(true);
  protected readonly betaFeatures = signal(false);
}
