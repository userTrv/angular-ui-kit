import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { UiButton } from '@usertrv/ui/button';
import { UiCombobox } from '@usertrv/ui/combobox';
import { UiDatepicker } from '@usertrv/ui/datepicker';
import { UiError, UiFormField, UiHint, UiLabel } from '@usertrv/ui/form-field';
import { UiSelect, UiSelectOption } from '@usertrv/ui/select';

interface Trip {
  city: string | null;
  seat: string | null;
  departure: Date | null;
}

@Component({
  selector: 'docs-form-field-kit-controls-example',
  imports: [FormField, UiFormField, UiLabel, UiHint, UiError, UiSelect, UiSelectOption, UiCombobox, UiDatepicker, UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="docs-stack" novalidate (submit)="onSubmit($event)">
      <ui-form-field>
        <ui-label>Destination</ui-label>
        <ui-combobox placeholder="Start typing a city" [options]="cities" [formField]="trip.city" />
        <ui-hint>Five cities in this demo.</ui-hint>
        <ui-error>Choose a destination.</ui-error>
      </ui-form-field>

      <ui-form-field>
        <ui-label>Seat</ui-label>
        <ui-select placeholder="No preference" [formField]="trip.seat">
          <ui-option value="window">Window</ui-option>
          <ui-option value="aisle">Aisle</ui-option>
        </ui-select>
        <ui-error>Choose a seat.</ui-error>
      </ui-form-field>

      <ui-form-field>
        <ui-label>Departure</ui-label>
        <ui-datepicker [formField]="trip.departure" />
        <ui-error>Enter a departure date.</ui-error>
      </ui-form-field>

      <div class="docs-row">
        <button uiButton variant="primary" type="submit">Book</button>
      </div>
      <p class="docs-muted" aria-live="polite">{{ booked() }}</p>
    </form>
  `,
})
export class FormFieldKitControlsExample {
  protected readonly cities = ['Amsterdam', 'Berlin', 'Lisbon', 'Paris', 'Vienna'];
  private readonly model = signal<Trip>({ city: null, seat: null, departure: null });
  protected readonly trip = form(this.model, (p) => {
    required(p.city);
    required(p.seat);
    required(p.departure);
  });
  protected readonly booked = signal('');

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const ok = await submit(this.trip, {
      action: async () => undefined,
      onInvalid: (tree) => tree().errorSummary()[0]?.fieldTree().focusBoundControl(),
    });
    const { city, seat, departure } = this.model();
    this.booked.set(ok ? `Booked: ${city}, ${seat} seat, ${departure?.toLocaleDateString('en-US')}.` : 'Please fill in the highlighted fields.');
  }
}
