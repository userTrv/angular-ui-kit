import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';
import { UiFormField, UiHint, UiInput, UiLabel, UiPrefix, UiSuffix } from '@usertrv/ui/form-field';

@Component({
  selector: 'docs-form-field-anatomy-example',
  imports: [UiFormField, UiInput, UiLabel, UiHint, UiPrefix, UiSuffix, UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-stack">
      <ui-form-field>
        <ui-label>Search orders</ui-label>
        <svg uiPrefix viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M8.5 3a5.5 5.5 0 0 1 4.4 8.8l3.6 3.7a1 1 0 0 1-1.4 1.4l-3.7-3.6A5.5 5.5 0 1 1 8.5 3Zm0 2a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
        </svg>
        <input #search uiInput type="search" placeholder="Order number or customer" [value]="query()" (input)="query.set(search.value)" />
        @if (query()) {
          <button uiIconButton uiSuffix variant="ghost" size="sm" aria-label="Clear search" (click)="query.set('')">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5.3 5.3a1 1 0 0 1 1.4 0L10 8.6l3.3-3.3a1 1 0 1 1 1.4 1.4L11.4 10l3.3 3.3a1 1 0 0 1-1.4 1.4L10 11.4l-3.3 3.3a1 1 0 0 1-1.4-1.4L8.6 10 5.3 6.7a1 1 0 0 1 0-1.4Z" /></svg>
          </button>
        }
      </ui-form-field>

      <ui-form-field>
        <ui-label>Monthly budget</ui-label>
        <span uiPrefix aria-hidden="true">$</span>
        <input uiInput type="number" inputmode="decimal" min="0" value="1200" />
        <span uiSuffix>USD</span>
        <ui-hint>Alerts are sent at 80% of the budget.</ui-hint>
      </ui-form-field>

      <ui-form-field size="sm">
        <ui-label>Workspace URL</ui-label>
        <input uiInput readonly value="acme.usertrv.dev" />
        <ui-hint>Read-only: contact an owner to change it.</ui-hint>
      </ui-form-field>

      <ui-form-field>
        <ui-label>Invoice email</ui-label>
        <input uiInput type="email" disabled value="billing@acme.io" />
      </ui-form-field>
    </div>
  `,
})
export class FormFieldAnatomyExample {
  protected readonly query = signal('');
}
