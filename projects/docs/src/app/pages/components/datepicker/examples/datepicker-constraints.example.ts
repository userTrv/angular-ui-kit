import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormField, form, maxDate, minDate, required } from '@angular/forms/signals';
import { UiDateFilter, UiDatepicker } from '@usertrv/ui/datepicker';

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

@Component({
  selector: 'docs-datepicker-constraints-example',
  imports: [UiDatepicker, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-stack">
      <label for="delivery-date">Delivery date</label>
      <ui-datepicker
        inputId="delivery-date"
        aria-describedby="delivery-date-hint delivery-date-error"
        [formField]="order.delivery"
        [dateFilter]="businessDays"
      />
      <span id="delivery-date-hint" class="docs-muted">Weekdays only, from tomorrow up to 60 days ahead.</span>
      <span id="delivery-date-error" class="docs-muted" aria-live="polite">
        @if (order.delivery().touched()) {
          @for (error of order.delivery().errors(); track error.kind) {
            {{ error.message }}
          }
        }
      </span>
    </div>
  `,
})
export class DatepickerConstraintsExample {
  private readonly today = new Date(new Date().setHours(0, 0, 0, 0));
  private readonly model = signal<{ delivery: Date | null }>({ delivery: null });

  // minDate()/maxDate() validate the value and are bound to the picker's min/max automatically.
  protected readonly order = form(this.model, (path) => {
    required(path.delivery, { message: 'Choose a delivery date.' });
    minDate(path.delivery, addDays(this.today, 1), { message: 'The earliest delivery is tomorrow.' });
    maxDate(path.delivery, addDays(this.today, 60), { message: 'We schedule at most 60 days ahead.' });
  });

  protected readonly businessDays: UiDateFilter = (date) => date.getDay() !== 0 && date.getDay() !== 6;
}
