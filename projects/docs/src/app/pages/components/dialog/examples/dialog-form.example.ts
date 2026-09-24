import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiButton } from '@usertrv/ui/button';
import {
  UI_DIALOG_DATA,
  UiDialog,
  UiDialogActions,
  UiDialogClose,
  UiDialogContent,
  UiDialogRef,
  UiDialogTitle,
} from '@usertrv/ui/dialog';
import { UiError, UiFormField, UiInput, UiLabel } from '@usertrv/ui/form-field';

interface RenameData {
  name: string;
}

@Component({
  selector: 'docs-rename-dialog',
  imports: [ReactiveFormsModule, UiButton, UiDialogTitle, UiDialogContent, UiDialogActions, UiDialogClose, UiFormField, UiLabel, UiInput, UiError],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="save()">
      <h2 uiDialogTitle>Rename project</h2>
      <div uiDialogContent>
        <ui-form-field>
          <ui-label>Project name</ui-label>
          <input uiInput formControlName="name" autocomplete="off" />
          <ui-error>Enter a name of up to 60 characters.</ui-error>
        </ui-form-field>
      </div>
      <div uiDialogActions>
        <button uiButton uiDialogClose>Cancel</button>
        <button uiButton variant="primary" type="submit">Rename</button>
      </div>
    </form>
  `,
})
class RenameDialog {
  private readonly ref = inject<UiDialogRef<string>>(UiDialogRef);
  private readonly data = inject(UI_DIALOG_DATA) as RenameData;

  protected readonly form = new FormGroup({
    name: new FormControl(this.data.name, {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(60)],
    }),
  });

  protected save(): void {
    if (this.form.valid) this.ref.close(this.form.controls.name.value.trim());
  }
}

@Component({
  selector: 'docs-dialog-form-example',
  imports: [UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-row">
      <strong>{{ name() }}</strong>
      <button uiButton size="sm" (click)="rename()">Rename…</button>
    </div>
  `,
})
export class DialogFormExample {
  private readonly dialog = inject(UiDialog);
  protected readonly name = signal('Mobile app launch');

  protected async rename(): Promise<void> {
    const ref = this.dialog.open<string, RenameData>(RenameDialog, { data: { name: this.name() } });
    const result = await ref.result;
    if (result) this.name.set(result);
  }
}
