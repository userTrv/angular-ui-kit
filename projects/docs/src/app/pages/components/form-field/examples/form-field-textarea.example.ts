import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiFormField, UiHint, UiInput, UiLabel, UiTextareaAutosize } from '@usertrv/ui/form-field';

@Component({
  selector: 'docs-form-field-textarea-example',
  imports: [UiFormField, UiInput, UiLabel, UiHint, UiTextareaAutosize],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-stack">
      <ui-form-field>
        <ui-label>Release notes</ui-label>
        <textarea
          #field
          uiInput
          autosize
          minRows="3"
          maxRows="8"
          [maxLength]="limit"
          [value]="notes()"
          (input)="notes.set(field.value)"
        ></textarea>
        <ui-hint>Markdown is supported.</ui-hint>
        <ui-hint align="end">{{ notes().length }} / {{ limit }}</ui-hint>
      </ui-form-field>
    </div>
  `,
})
export class FormFieldTextareaExample {
  protected readonly limit = 280;
  protected readonly notes = signal('Fixed focus restoration when closing nested dialogs.');
}
