import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiCombobox } from '@usertrv/ui/combobox';

@Component({
  selector: 'docs-combobox-static-example',
  imports: [UiCombobox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    label {
      display: block;
      margin-bottom: var(--ui-space-1-5);
      font-size: var(--ui-font-size-sm);
      font-weight: var(--ui-font-weight-medium);
    }
  `,
  template: `
    <div class="docs-stack">
      <div>
        <label for="shipping-country">Shipping country</label>
        <ui-combobox inputId="shipping-country" placeholder="Start typing a country" [options]="countries" [(value)]="country" />
      </div>
      <p class="docs-muted">Value: {{ country() ?? 'none' }}</p>
    </div>
  `,
})
export class ComboboxStaticExample {
  protected readonly country = signal<string | null>(null);
  protected readonly countries = [
    'Argentina', 'Armenia', 'Australia', 'Austria', 'Belgium', 'Brazil', 'Canada', 'Chile', 'Czechia',
    'Denmark', 'Estonia', 'Finland', 'France', 'Georgia', 'Germany', 'Greece', 'Iceland', 'India',
    'Ireland', 'Italy', 'Japan', 'Kazakhstan', 'Latvia', 'Lithuania', 'Mexico', 'Netherlands',
    'New Zealand', 'Norway', 'Poland', 'Portugal', 'Serbia', 'Singapore', 'South Korea', 'Spain',
    'Sweden', 'Switzerland', 'Turkey', 'United Arab Emirates', 'United Kingdom', 'United States',
  ];
}
