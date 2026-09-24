import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiButton } from '@usertrv/ui/button';
import { UiError } from '@usertrv/ui/form-field';
import { UiControlValueAccessor } from '@usertrv/ui/forms';
import { UiSelect, UiSelectOption } from '@usertrv/ui/select';

interface Plan {
  id: string;
  name: string;
  price: number;
}

@Component({
  selector: 'docs-select-forms-example',
  imports: [ReactiveFormsModule, UiControlValueAccessor, UiSelect, UiSelectOption, UiButton, UiError],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .label {
      display: block;
      margin-bottom: var(--ui-space-1-5);
      font-size: var(--ui-font-size-sm);
      font-weight: var(--ui-font-weight-medium);
    }
  `,
  template: `
    <form class="docs-stack" [formGroup]="form" (ngSubmit)="save()">
      <div>
        <span class="label" id="plan-label">Billing plan</span>
        <ui-select
          formControlName="plan"
          aria-labelledby="plan-label"
          aria-describedby="plan-error"
          placeholder="Choose a plan"
          [compareWith]="sameId"
        >
          @for (plan of plans; track plan.id) {
            <ui-option [value]="plan">{{ plan.name }} — {{ plan.price ? '$' + plan.price + '/mo' : 'free' }}</ui-option>
          }
        </ui-select>
        <div id="plan-error">
          @if (showError()) {
            <ui-error>Choose a plan to continue.</ui-error>
          }
        </div>
      </div>
      <div class="docs-row">
        <button uiButton variant="primary" type="submit">Save</button>
        <button uiButton type="button" (click)="form.reset()">Reset</button>
      </div>
      <p class="docs-muted">Value: {{ form.value.plan?.name ?? 'none' }}, touched: {{ form.controls.plan.touched }}</p>
    </form>
  `,
})
export class SelectFormsExample {
  protected readonly plans: Plan[] = [
    { id: 'free', name: 'Hobby', price: 0 },
    { id: 'team', name: 'Team', price: 20 },
    { id: 'business', name: 'Business', price: 45 },
  ];
  protected readonly form = new FormGroup({
    // The saved value is a copy from the server: compareWith matches it to an option by id.
    plan: new FormControl<Plan | null>({ id: 'team', name: 'Team', price: 20 }, Validators.required),
  });
  protected readonly sameId = (a: Plan, b: Plan) => a.id === b.id;

  protected showError(): boolean {
    const plan = this.form.controls.plan;
    return plan.invalid && plan.touched;
  }

  protected save(): void {
    this.form.markAllAsTouched();
  }
}
