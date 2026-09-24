import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiRadioButton, UiRadioGroup } from '@usertrv/ui/radio';

type Visibility = 'private' | 'internal' | 'public';

@Component({
  selector: 'docs-radio-basic-example',
  imports: [UiRadioGroup, UiRadioButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-stack">
      <ui-radio-group label="Repository visibility" [(value)]="visibility">
        <ui-radio-button value="private">Private — only invited members</ui-radio-button>
        <ui-radio-button value="internal">Internal — everyone in the organisation</ui-radio-button>
        <ui-radio-button value="public" disabled>Public — disabled by your organisation policy</ui-radio-button>
      </ui-radio-group>
      <p class="docs-muted">Selected: {{ visibility() }}</p>
    </div>
  `,
})
export class RadioBasicExample {
  protected readonly visibility = signal<Visibility>('private');
}
