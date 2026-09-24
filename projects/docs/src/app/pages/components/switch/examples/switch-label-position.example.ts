import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { UiSwitch } from '@usertrv/ui/switch';

interface Notifications {
  mentions: boolean;
  digest: boolean;
}

@Component({
  selector: 'docs-switch-label-position-example',
  imports: [FormField, UiSwitch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-stack">
      <ui-switch labelPosition="before" [formField]="prefs.mentions">Mentions and replies</ui-switch>
      <ui-switch labelPosition="before" [formField]="prefs.digest">Weekly digest</ui-switch>
      <p class="docs-muted">Mentions: {{ model().mentions }}, digest: {{ model().digest }}</p>
    </div>
  `,
})
export class SwitchLabelPositionExample {
  protected readonly model = signal<Notifications>({ mentions: true, digest: false });
  protected readonly prefs = form(this.model);
}
