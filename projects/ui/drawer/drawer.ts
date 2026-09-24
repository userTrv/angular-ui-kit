import { createGlobalPositionStrategy } from '@angular/cdk/overlay';
import { ComponentType } from '@angular/cdk/portal';
import { Injectable, Injector, TemplateRef, inject } from '@angular/core';
import { UiDialog, UiDialogConfig, UiDialogRef, UiDialogTemplateContext } from '@usertrv/ui/dialog';

/** Edge the drawer slides in from. `start`/`end` follow the text direction. */
export type UiDrawerPosition = 'start' | 'end' | 'bottom';

/** Options for `UiDrawer.open()`: every dialog option except `size`, plus the edge. */
export interface UiDrawerConfig<D = unknown> extends Omit<UiDialogConfig<D>, 'size'> {
  /** Edge to attach to. Default `end`. */
  position?: UiDrawerPosition;
}

/**
 * Opens side sheets (full-height, attached to the start or end edge) and bottom sheets.
 *
 * A drawer is a modal dialog in a different place: it goes through `UiDialog`, so focus trap,
 * `aria-modal`, `inert` background, stacking, Escape and focus restoration are identical, and the
 * dialog parts (`uiDialogTitle`, `uiDialogContent`, `uiDialogActions`, `uiDialogClose`) work inside it.
 * Width comes from the `--ui-drawer-width` token; the slide-in uses `--ui-duration-slow`.
 */
@Injectable({ providedIn: 'root' })
export class UiDrawer {
  private readonly dialog = inject(UiDialog);
  private readonly injector = inject(Injector);

  /**
   * Opens a component or template in a drawer.
   * @param content Component class or `TemplateRef` (context: `UiDialogTemplateContext`).
   * @param config Edge, data, focus and labelling options.
   */
  open<R = unknown, D = unknown, C = unknown>(
    content: ComponentType<C> | TemplateRef<UiDialogTemplateContext<D, R>>,
    config: UiDrawerConfig<D> = {},
  ): UiDialogRef<R, C> {
    const { position = 'end', ...dialogConfig } = config;
    const strategy = createGlobalPositionStrategy(this.injector);
    if (position === 'bottom') strategy.bottom('0').centerHorizontally();
    else if (position === 'start') strategy.start('0').top('0');
    else strategy.end('0').top('0');

    return this.dialog._openSurface<R, D, C>(content, dialogConfig, {
      panelClass: ['ui-drawer-pane', `ui-drawer-pane--${position}`],
      positionStrategy: strategy,
    });
  }
}
