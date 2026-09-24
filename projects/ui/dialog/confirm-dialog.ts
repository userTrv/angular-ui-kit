import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';
import { UI_DIALOG_DATA } from './dialog-config';
import { UiDialogActions, UiDialogClose, UiDialogContent, UiDialogTitle } from './dialog-parts';

/** Options for `UiDialog.confirm()`. */
export interface UiConfirmOptions {
  /** Question or action, e.g. "Delete project?". Becomes the dialog's accessible name. */
  title: string;
  /** Consequences of confirming. Becomes the dialog's accessible description. */
  message: string;
  /** Label of the confirm button. Default "Confirm". */
  confirmLabel?: string;
  /** Label of the cancel button. Default "Cancel". */
  cancelLabel?: string;
  /** `danger` styles the confirm button as destructive. Default `primary`. */
  variant?: 'primary' | 'danger';
}

/** @internal */
export interface UiConfirmDialogData extends UiConfirmOptions {
  messageId: string;
}

/** @internal Content of `UiDialog.confirm()`. */
@Component({
  selector: 'ui-confirm-dialog',
  imports: [UiButton, UiDialogTitle, UiDialogContent, UiDialogActions, UiDialogClose],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 uiDialogTitle>{{ data.title }}</h2>
    <p uiDialogContent [id]="data.messageId">{{ data.message }}</p>
    <div uiDialogActions>
      <button uiButton data-ui-confirm-cancel [uiDialogClose]="false">{{ data.cancelLabel ?? 'Cancel' }}</button>
      <button uiButton [variant]="data.variant ?? 'primary'" [uiDialogClose]="true">
        {{ data.confirmLabel ?? 'Confirm' }}
      </button>
    </div>
  `,
})
export class UiConfirmDialog {
  protected readonly data = inject(UI_DIALOG_DATA) as UiConfirmDialogData;
}
