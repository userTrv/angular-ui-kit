import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiCheckbox } from '@usertrv/ui/checkbox';

@Component({
  selector: 'docs-checkbox-states-example',
  imports: [UiCheckbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-stack">
      <ui-checkbox [(checked)]="remember">Remember this device</ui-checkbox>
      <ui-checkbox [checked]="true" disabled>Two-factor authentication (required by your organisation)</ui-checkbox>
      <ui-checkbox disabled>Single sign-on (Enterprise plan)</ui-checkbox>
      <p class="docs-muted">Remember this device: {{ remember() ? 'yes' : 'no' }}</p>
    </div>
  `,
})
export class CheckboxStatesExample {
  protected readonly remember = signal(true);
}
