import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiCheckbox } from '@usertrv/ui/checkbox';
import { UiError } from '@usertrv/ui/form-field';
import { UiControlValueAccessor } from '@usertrv/ui/forms';

@Component({
  selector: 'docs-checkbox-forms-example',
  imports: [ReactiveFormsModule, UiControlValueAccessor, UiCheckbox, UiError],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-stack">
      <ui-checkbox [formControl]="consent" aria-describedby="consent-error">
        I agree to the data processing agreement
      </ui-checkbox>
      <!-- Stays in the DOM: aria-describedby must not point at a missing id. Empty until touched. -->
      <div id="consent-error">
        @if (consent.touched && consent.invalid) {
          <ui-error>Accept the agreement to enable the integration.</ui-error>
        }
      </div>
      <p class="docs-muted">Value: {{ consent.value }}, touched: {{ consent.touched }}</p>
    </div>
  `,
})
export class CheckboxFormsExample {
  protected readonly consent = new FormControl(false, { nonNullable: true, validators: Validators.requiredTrue });
}
