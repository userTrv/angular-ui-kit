import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiButton } from '@usertrv/ui/button';
import { UiCheckbox } from '@usertrv/ui/checkbox';
import { UiError, UiFormField, UiHint, UiInput, UiLabel } from '@usertrv/ui/form-field';
import { UiControlValueAccessor } from '@usertrv/ui/forms';
import { UiRadioButton, UiRadioGroup } from '@usertrv/ui/radio';
import { UiSwitch } from '@usertrv/ui/switch';

type Role = 'viewer' | 'editor' | 'admin';

@Component({
  selector: 'docs-form-field-reactive-forms-example',
  imports: [
    ReactiveFormsModule,
    // Bridges ui-checkbox / ui-radio-group / ui-switch to formControlName (not needed for <input uiInput>).
    UiControlValueAccessor,
    UiFormField,
    UiInput,
    UiLabel,
    UiHint,
    UiError,
    UiRadioGroup,
    UiRadioButton,
    UiCheckbox,
    UiSwitch,
    UiButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="docs-stack" [formGroup]="invite" (ngSubmit)="send()">
      <ui-form-field>
        <ui-label>Email</ui-label>
        <input uiInput type="email" formControlName="email" />
        <ui-hint>They will get a link valid for 7 days.</ui-hint>
        @if (invite.controls.email.hasError('required')) {
          <ui-error>Enter the teammate's email.</ui-error>
        } @else {
          <ui-error>That does not look like an email address.</ui-error>
        }
      </ui-form-field>

      <ui-radio-group label="Role" formControlName="role" orientation="horizontal">
        <ui-radio-button value="viewer">Viewer</ui-radio-button>
        <ui-radio-button value="editor">Editor</ui-radio-button>
        <ui-radio-button value="admin">Admin</ui-radio-button>
      </ui-radio-group>

      <ui-checkbox formControlName="billing">Can manage billing</ui-checkbox>
      <ui-switch formControlName="notify" description="Posts a message in #team when they join.">
        Notify the team
      </ui-switch>

      <div class="docs-row">
        <button uiButton variant="primary" type="submit">Send invite</button>
        <button uiButton type="button" (click)="invite.reset()">Reset</button>
      </div>
      <p class="docs-muted" aria-live="polite">{{ sent() }}</p>
    </form>
  `,
})
export class FormFieldReactiveFormsExample {
  protected readonly invite = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    role: ['viewer' as Role, Validators.required],
    billing: false,
    notify: true,
  });

  protected readonly sent = signal('');

  protected send(): void {
    if (this.invite.invalid) return; // the submit event itself reveals the errors
    const { email, role } = this.invite.getRawValue();
    this.sent.set(`Invite sent to ${email} as ${role}.`);
    this.invite.reset();
  }
}
