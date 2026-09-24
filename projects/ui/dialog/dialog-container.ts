import { CdkDialogContainer } from '@angular/cdk/dialog';
import { CdkPortalOutlet } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Styled surface of dialogs and drawers. Extends the CDK container, so the focus trap, initial
 * focus, `role`, `aria-modal` and `aria-labelledby` wiring are CDK's; this class only adds the
 * kit's styles (which is why it exists: a stylesheet needs a component to be loaded).
 *
 * @internal
 */
@Component({
  selector: 'ui-dialog-container',
  imports: [CdkPortalOutlet],
  template: `<ng-template cdkPortalOutlet />`,
  styleUrls: ['./dialog.css', './dialog-sheet.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-dialog' },
})
export class UiDialogContainer extends CdkDialogContainer {}
