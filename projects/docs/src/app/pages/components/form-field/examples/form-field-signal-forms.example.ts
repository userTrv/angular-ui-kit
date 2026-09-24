import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormField, email, form, minLength, required, submit } from '@angular/forms/signals';
import { UiButton } from '@usertrv/ui/button';
import { UiCheckbox } from '@usertrv/ui/checkbox';
import { UiError, UiFormField, UiHint, UiInput, UiLabel } from '@usertrv/ui/form-field';
import { UiRadioButton, UiRadioGroup } from '@usertrv/ui/radio';
import { UiSwitch } from '@usertrv/ui/switch';

type Plan = 'starter' | 'team' | 'enterprise';

interface Signup {
  name: string;
  email: string;
  password: string;
  plan: Plan | null;
  terms: boolean;
  productNews: boolean;
}

@Component({
  selector: 'docs-form-field-signal-forms-example',
  imports: [FormField, UiFormField, UiInput, UiLabel, UiHint, UiError, UiCheckbox, UiRadioGroup, UiRadioButton, UiSwitch, UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="docs-stack" novalidate (submit)="onSubmit($event)">
      <ui-form-field>
        <ui-label>Full name</ui-label>
        <input uiInput autocomplete="name" [formField]="signup.name" />
        @for (error of signup.name().errors(); track error.kind) {
          <ui-error>{{ error.message }}</ui-error>
        }
      </ui-form-field>

      <ui-form-field>
        <ui-label>Work email</ui-label>
        <input uiInput type="email" autocomplete="email" [formField]="signup.email" />
        @for (error of signup.email().errors(); track error.kind) {
          <ui-error>{{ error.message }}</ui-error>
        }
      </ui-form-field>

      <ui-form-field>
        <ui-label>Password</ui-label>
        <input uiInput type="password" autocomplete="new-password" [formField]="signup.password" />
        <ui-hint>At least 12 characters.</ui-hint>
        @for (error of signup.password().errors(); track error.kind) {
          <ui-error>{{ error.message }}</ui-error>
        }
      </ui-form-field>

      <ui-radio-group label="Plan" [formField]="signup.plan" [aria-describedby]="planError()">
        <ui-radio-button value="starter">Starter — free for 3 users</ui-radio-button>
        <ui-radio-button value="team">Team — $8 per user</ui-radio-button>
        <ui-radio-button value="enterprise">Enterprise — talk to sales</ui-radio-button>
      </ui-radio-group>
      @if (planError(); as id) {
        <ui-error [id]="id">Choose a plan.</ui-error>
      }

      <ui-checkbox [formField]="signup.terms" [aria-describedby]="termsError()">
        I accept the terms of service
      </ui-checkbox>
      @if (termsError(); as id) {
        <ui-error [id]="id">You need to accept the terms to continue.</ui-error>
      }

      <ui-switch [formField]="signup.productNews" description="About once a month, no marketing.">
        Email me product updates
      </ui-switch>

      <div class="docs-row">
        <button uiButton variant="primary" type="submit" [loading]="signup().submitting()">Create account</button>
        <span class="docs-muted" aria-live="polite">{{ status() }}</span>
      </div>
    </form>
  `,
})
export class FormFieldSignalFormsExample {
  private readonly model = signal<Signup>({
    name: '',
    email: '',
    password: '',
    plan: null,
    terms: false,
    productNews: true,
  });

  protected readonly signup = form(this.model, (s) => {
    required(s.name, { message: 'Enter your name.' });
    required(s.email, { message: 'Enter your work email.' });
    email(s.email, { message: 'That does not look like an email address.' });
    required(s.password, { message: 'Choose a password.' });
    minLength(s.password, 12, { message: 'Use at least 12 characters.' });
    required(s.plan);
    required(s.terms);
  });

  protected readonly status = signal('');

  // Checkbox and radio group sit outside ui-form-field, so their error text is linked by hand.
  protected readonly planError = computed(() => {
    const plan = this.signup.plan();
    return plan.touched() && plan.invalid() ? 'signup-plan-error' : undefined;
  });
  protected readonly termsError = computed(() => {
    const terms = this.signup.terms();
    return terms.touched() && terms.invalid() ? 'signup-terms-error' : undefined;
  });

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.status.set('');
    // submit() marks every field as touched, so all errors show up; the action runs only when valid.
    const ok = await submit(this.signup, {
      action: async () => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return undefined;
      },
      onInvalid: (tree) => tree().errorSummary()[0]?.fieldTree().focusBoundControl(),
    });
    this.status.set(ok ? `Welcome aboard, ${this.model().name}!` : 'Please fix the highlighted fields.');
  }
}
