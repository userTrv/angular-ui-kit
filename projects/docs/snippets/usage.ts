import { Component, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { UiButton } from '@usertrv/ui/button';
import { UiFormField, UiInput, UiLabel, UiError } from '@usertrv/ui/form-field';

@Component({
  selector: 'app-signup',
  imports: [FormField, UiButton, UiFormField, UiInput, UiLabel, UiError],
  template: `
    <ui-form-field>
      <ui-label>Email</ui-label>
      <input uiInput type="email" [formField]="signup.email" />
      <ui-error>Enter your email</ui-error>
    </ui-form-field>
    <button uiButton variant="primary" [loading]="saving()">Create account</button>
  `,
})
export class Signup {
  protected readonly saving = signal(false);
  protected readonly signup = form(signal({ email: '' }), (p) => required(p.email));
}
