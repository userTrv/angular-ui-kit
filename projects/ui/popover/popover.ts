import { Directive, InjectionToken, TemplateRef, inject, input } from '@angular/core';
import { injectId } from '@usertrv/ui/a11y';

/** @internal What the panel content can do with its popover (provided to the template). */
export interface UiPopoverControl {
  hide(reason: 'close'): void;
}

/** @internal */
export const UI_POPOVER_CONTROL = new InjectionToken<UiPopoverControl>('UI_POPOVER_CONTROL');

/**
 * Content of a popover: `<ng-template uiPopover #filters="uiPopover" uiPopoverLabel="Filters">`.
 * Rendered lazily into a non-modal dialog (`role="dialog"`) when its `uiPopoverTrigger` opens it.
 * Give it an accessible name with `uiPopoverLabel` or `uiPopoverLabelledBy` (id of a heading inside).
 */
@Directive({
  selector: '[uiPopover]',
  exportAs: 'uiPopover',
})
export class UiPopover {
  /** @internal */
  readonly templateRef = inject<TemplateRef<void>>(TemplateRef);
  /** Id of the rendered panel, referenced by the trigger's `aria-controls`. */
  readonly panelId = injectId('ui-popover');

  /** Accessible name of the panel. */
  readonly label = input<string | null>(null, { alias: 'uiPopoverLabel' });
  /** Id of an element inside the panel that names it (usually its heading). */
  readonly labelledBy = input<string | null>(null, { alias: 'uiPopoverLabelledBy' });
}

/** Closes the enclosing popover on click and returns focus to its trigger. */
@Directive({
  selector: 'button[uiPopoverClose]',
  host: { type: 'button', '(click)': 'control?.hide("close")' },
})
export class UiPopoverClose {
  protected readonly control = inject(UI_POPOVER_CONTROL, { optional: true });
}
