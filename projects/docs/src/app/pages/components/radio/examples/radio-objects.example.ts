import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiRadioButton, UiRadioGroup } from '@usertrv/ui/radio';

interface ShippingOption {
  id: string;
  label: string;
  days: string;
}

@Component({
  selector: 'docs-radio-objects-example',
  imports: [UiRadioGroup, UiRadioButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-stack">
      <ui-radio-group label="Shipping" orientation="horizontal" [compareWith]="sameId" [(value)]="shipping">
        @for (option of options; track option.id) {
          <ui-radio-button [value]="option">{{ option.label }}</ui-radio-button>
        }
      </ui-radio-group>
      <p class="docs-muted">Arrives in {{ shipping()?.days }}</p>
    </div>
  `,
})
export class RadioObjectsExample {
  protected readonly options: ShippingOption[] = [
    { id: 'standard', label: 'Standard', days: '3–5 days' },
    { id: 'express', label: 'Express', days: '1–2 days' },
    { id: 'pickup', label: 'Store pickup', days: 'same day' },
  ];

  // A copy, as if it came back from the server: compareWith matches it by id.
  protected readonly shipping = signal<ShippingOption | null>({ ...this.options[1] });

  protected readonly sameId = (a: ShippingOption | null, b: ShippingOption | null) => a?.id === b?.id;
}
